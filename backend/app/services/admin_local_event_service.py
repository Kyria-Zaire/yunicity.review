"""Admin local event service (ADMIN-05C / 05D-A / 05D-C1)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.event_admin_constants import (
    EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    EVENT_ADMIN_ACTIONS,
    EventAdminAction,
)
from app.core.local_event_constants import LocalEventModerationStatus
from app.models.local_event import LocalEvent
from app.models.user import User
from app.repositories.admin_local_event_repository import (
    AdminEventActionRow,
    AdminLocalEventRepository,
)
from app.schemas.admin_local_event import (
    AdminLocalEventActionItem,
    AdminLocalEventActionListResponse,
    AdminLocalEventActorSummary,
    AdminLocalEventCancelRequest,
    AdminLocalEventDetailResponse,
    AdminLocalEventOrganizationDetail,
)
from app.services.feed_event_sync import FeedEventSyncService


class AdminLocalEventService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AdminLocalEventRepository(session)

    async def get_event_detail(self, event_id: uuid.UUID) -> AdminLocalEventDetailResponse:
        event = await self._require_event(event_id)
        return await self._to_detail_response(event)

    async def cancel_event(
        self,
        actor: User,
        event_id: uuid.UUID,
        payload: AdminLocalEventCancelRequest,
    ) -> AdminLocalEventDetailResponse:
        event = await self._require_event(event_id)
        if event.is_cancelled:
            raise AppError(
                status_code=409,
                code="EVENT_ALREADY_CANCELLED",
                detail="Cet événement est déjà annulé.",
            )
        if event.moderation_status != LocalEventModerationStatus.APPROVED.value:
            raise AppError(
                status_code=422,
                code="EVENT_CANCEL_NOT_ALLOWED",
                detail="Seuls les événements approuvés peuvent être annulés par le staff.",
            )

        reason = payload.reason.strip()
        now = datetime.now(UTC)
        approved = LocalEventModerationStatus.APPROVED.value
        event.is_cancelled = True
        event.cancelled_at = now
        event.cancelled_by_user_id = actor.id

        await self._repo.record_admin_action(
            local_event_id=event.id,
            action=EventAdminAction.CANCEL.value,
            actor_user_id=actor.id,
            previous_status=approved,
            new_status=approved,
            reason=reason,
            metadata={"is_cancelled": True},
            created_at=now,
        )

        org = event.organization
        await FeedEventSyncService(self._session).upsert_event_post(event, org)
        await self._session.commit()

        refreshed = await self._require_event(event_id)
        return await self._to_detail_response(refreshed)

    async def list_event_actions(
        self,
        *,
        event_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> AdminLocalEventActionListResponse:
        if not await self._repo.event_exists(event_id):
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )

        resolved_page_size = min(max(page_size, 1), EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_admin_actions(
            local_event_id=event_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminLocalEventActionListResponse(
            items=[self._to_action_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def _require_event(self, event_id: uuid.UUID) -> LocalEvent:
        event = await self._repo.get_by_id(event_id)
        if event is None:
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )
        return event

    async def _to_detail_response(self, event: LocalEvent) -> AdminLocalEventDetailResponse:
        interest_count = await self._repo.count_interests(event.id)
        org = event.organization
        org_detail = None
        if org is not None:
            org_detail = AdminLocalEventOrganizationDetail(
                id=org.id,
                name=org.name,
                slug=org.slug,
                verification_status=org.verification_status,
                visibility=org.visibility,
            )
        return AdminLocalEventDetailResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            city=event.city,
            location_name=event.location_name,
            address=event.address,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            timezone=event.timezone,
            visibility=event.visibility,
            moderation_status=event.moderation_status,
            is_cancelled=event.is_cancelled,
            cancelled_at=event.cancelled_at,
            cancelled_by_user_id=event.cancelled_by_user_id,
            interest_count=interest_count,
            rejection_reason=event.rejection_reason,
            organization=org_detail,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    def _to_action_item(self, row: AdminEventActionRow) -> AdminLocalEventActionItem:
        entry = row.action
        if entry.action not in EVENT_ADMIN_ACTIONS:
            raise AppError(
                status_code=500,
                code="INVALID_EVENT_ADMIN_ACTION",
                detail="Action staff événement invalide en base.",
            )
        return AdminLocalEventActionItem(
            id=entry.id,
            action=entry.action,  # type: ignore[arg-type]
            previous_status=entry.previous_status,
            new_status=entry.new_status,
            reason=entry.reason,
            actor_user=self._to_action_actor(row),
            created_at=entry.created_at,
        )

    @staticmethod
    def _to_action_actor(row: AdminEventActionRow) -> AdminLocalEventActorSummary:
        actor = row.actor
        if actor is None:
            assert row.action.actor_user_id is not None
            return AdminLocalEventActorSummary(
                id=row.action.actor_user_id,
                email="Compte staff supprimé",
                display_name=None,
            )
        display_name: str | None = None
        if row.actor_profile is not None and row.actor_profile.display_name:
            display_name = row.actor_profile.display_name
        elif actor.full_name:
            display_name = actor.full_name
        return AdminLocalEventActorSummary(
            id=actor.id,
            email=actor.email,
            display_name=display_name,
        )
