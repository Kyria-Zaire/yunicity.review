"""Staff-only presence administration (PASSPORT-PRESENCE-01, lot 01A, B3/B4/B10).

Every effective change writes one ``presence_admin_actions`` row in the same transaction.
An idempotent PUT that changes nothing writes no audit row.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.presence_constants import (
    PRESENCE_ADMIN_LIST_PAGE_SIZE_MAX,
    PRESENCE_CAMPAIGN_TRANSITIONS,
    PresenceAdminActionType,
    PresenceCampaignStatus,
)
from app.models.presence import PresenceCampaign
from app.models.user import User
from app.repositories.presence_admin_repository import PresenceAdminRepository
from app.schemas.presence_admin import (
    PresenceAgentAssignmentResponse,
    PresenceAgentAssignmentSetRequest,
    PresenceCampaignCreateRequest,
    PresenceCampaignListResponse,
    PresenceCampaignResponse,
    PresenceCampaignStatusPatchRequest,
    PresenceCampaignStatusValue,
    PresenceRegistrationResponse,
    PresenceRegistrationSetRequest,
    PresenceUserTestFlagRequest,
    PresenceUserTestFlagResponse,
)


def _bool_value(value: bool) -> str:
    return "true" if value else "false"


class PresenceAdminService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = PresenceAdminRepository(session)

    # ---------------------------------------------------------------- campaigns

    async def create_campaign(
        self, actor: User, payload: PresenceCampaignCreateRequest
    ) -> PresenceCampaignResponse:
        if not await self._repo.organization_exists(payload.organization_id):
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organisation introuvable.",
            )
        if payload.local_event_id is not None and not await self._repo.local_event_exists(
            payload.local_event_id
        ):
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )

        now = datetime.now(UTC)
        campaign = await self._repo.add_campaign(
            PresenceCampaign(
                organization_id=payload.organization_id,
                local_event_id=payload.local_event_id,
                city=payload.city,
                title=payload.title,
                status=PresenceCampaignStatus.DRAFT.value,
                presence_opens_at=payload.presence_opens_at,
                presence_closes_at=payload.presence_closes_at,
                is_test=payload.is_test,
                created_by_user_id=actor.id,
            )
        )
        await self._repo.record_admin_action(
            action=PresenceAdminActionType.CAMPAIGN_CREATED.value,
            actor_user_id=actor.id,
            campaign_id=campaign.id,
            target_user_id=None,
            previous_value=None,
            new_value=PresenceCampaignStatus.DRAFT.value,
            created_at=now,
        )
        await self._session.commit()
        await self._session.refresh(campaign)
        return self._campaign_response(campaign)

    async def list_campaigns(
        self,
        *,
        status: PresenceCampaignStatusValue | None,
        organization_id: uuid.UUID | None,
        is_test: bool | None,
        page: int,
        page_size: int,
    ) -> PresenceCampaignListResponse:
        resolved_page = max(page, 1)
        resolved_page_size = min(max(page_size, 1), PRESENCE_ADMIN_LIST_PAGE_SIZE_MAX)
        items, total = await self._repo.list_campaigns(
            status=status,
            organization_id=organization_id,
            is_test=is_test,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return PresenceCampaignListResponse(
            items=[self._campaign_response(item) for item in items],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def change_campaign_status(
        self,
        campaign_id: uuid.UUID,
        actor: User,
        payload: PresenceCampaignStatusPatchRequest,
    ) -> PresenceCampaignResponse:
        campaign = await self._require_campaign(campaign_id, for_update=True)
        previous = campaign.status
        target = payload.status
        if target not in PRESENCE_CAMPAIGN_TRANSITIONS.get(previous, frozenset()):
            raise AppError(
                status_code=409,
                code="PRESENCE_INVALID_TRANSITION",
                detail="Transition de statut non autorisée pour cette campagne.",
                metadata={"current_status": previous, "requested_status": target},
            )

        campaign.status = target
        await self._session.flush()
        await self._repo.record_admin_action(
            action=PresenceAdminActionType.CAMPAIGN_STATUS_CHANGED.value,
            actor_user_id=actor.id,
            campaign_id=campaign.id,
            target_user_id=None,
            previous_value=previous,
            new_value=target,
            created_at=datetime.now(UTC),
        )
        await self._session.commit()
        await self._session.refresh(campaign)
        return self._campaign_response(campaign)

    # ------------------------------------------------------------ registrations

    async def set_registration(
        self,
        campaign_id: uuid.UUID,
        user_id: uuid.UUID,
        actor: User,
        payload: PresenceRegistrationSetRequest,
    ) -> PresenceRegistrationResponse:
        await self._require_campaign(campaign_id)
        await self._require_user(user_id)
        now = datetime.now(UTC)

        inserted = await self._repo.insert_registration_if_absent(
            campaign_id=campaign_id,
            user_id=user_id,
            status=payload.status,
            changed_by_user_id=actor.id,
            changed_at=now,
        )
        registration = await self._repo.get_registration_for_update(campaign_id, user_id)
        if registration is None:  # pragma: no cover - insert or concurrent insert guarantees it
            raise RuntimeError("presence registration vanished inside its transaction")

        previous: str | None = None
        changed = True
        if not inserted:
            previous = registration.status
            if previous == payload.status:
                changed = False
            else:
                registration.status = payload.status
                registration.status_changed_at = now
                registration.changed_by_user_id = actor.id
                await self._session.flush()

        if changed:
            await self._repo.record_admin_action(
                action=PresenceAdminActionType.REGISTRATION_SET.value,
                actor_user_id=actor.id,
                campaign_id=campaign_id,
                target_user_id=user_id,
                previous_value=previous,
                new_value=payload.status,
                created_at=now,
            )
        response = PresenceRegistrationResponse(
            campaign_id=campaign_id,
            user_id=user_id,
            status=payload.status,
            status_changed_at=registration.status_changed_at,
            changed=changed,
        )
        await self._session.commit()
        return response

    # -------------------------------------------------------------- assignments

    async def set_agent_assignment(
        self,
        campaign_id: uuid.UUID,
        agent_user_id: uuid.UUID,
        actor: User,
        payload: PresenceAgentAssignmentSetRequest,
    ) -> PresenceAgentAssignmentResponse:
        await self._require_campaign(campaign_id)
        await self._require_user(agent_user_id)
        now = datetime.now(UTC)

        inserted = await self._repo.insert_assignment_if_absent(
            campaign_id=campaign_id,
            agent_user_id=agent_user_id,
            status=payload.status,
            changed_by_user_id=actor.id,
            changed_at=now,
        )
        assignment = await self._repo.get_assignment_for_update(campaign_id, agent_user_id)
        if assignment is None:  # pragma: no cover - insert or concurrent insert guarantees it
            raise RuntimeError("presence assignment vanished inside its transaction")

        previous: str | None = None
        changed = True
        if not inserted:
            previous = assignment.status
            if previous == payload.status:
                changed = False
            else:
                assignment.status = payload.status
                assignment.status_changed_at = now
                assignment.changed_by_user_id = actor.id
                await self._session.flush()

        if changed:
            await self._repo.record_admin_action(
                action=PresenceAdminActionType.AGENT_ASSIGNMENT_SET.value,
                actor_user_id=actor.id,
                campaign_id=campaign_id,
                target_user_id=agent_user_id,
                previous_value=previous,
                new_value=payload.status,
                created_at=now,
            )
        response = PresenceAgentAssignmentResponse(
            campaign_id=campaign_id,
            agent_user_id=agent_user_id,
            status=payload.status,
            status_changed_at=assignment.status_changed_at,
            changed=changed,
        )
        await self._session.commit()
        return response

    # ---------------------------------------------------------------- test flag

    async def set_user_test_flag(
        self,
        user_id: uuid.UUID,
        actor: User,
        payload: PresenceUserTestFlagRequest,
    ) -> PresenceUserTestFlagResponse:
        user = await self._require_user(user_id, for_update=True)
        previous = user.is_test
        changed = previous != payload.is_test
        if changed:
            user.is_test = payload.is_test
            await self._session.flush()
            await self._repo.record_admin_action(
                action=PresenceAdminActionType.USER_TEST_FLAG_SET.value,
                actor_user_id=actor.id,
                campaign_id=None,
                target_user_id=user_id,
                previous_value=_bool_value(previous),
                new_value=_bool_value(payload.is_test),
                created_at=datetime.now(UTC),
            )
        await self._session.commit()
        return PresenceUserTestFlagResponse(
            user_id=user_id, is_test=payload.is_test, changed=changed
        )

    # ------------------------------------------------------------------ helpers

    async def _require_campaign(
        self, campaign_id: uuid.UUID, *, for_update: bool = False
    ) -> PresenceCampaign:
        campaign = await self._repo.get_campaign(campaign_id, for_update=for_update)
        if campaign is None:
            raise AppError(
                status_code=404,
                code="PRESENCE_CAMPAIGN_NOT_FOUND",
                detail="Campagne de présence introuvable.",
            )
        return campaign

    async def _require_user(self, user_id: uuid.UUID, *, for_update: bool = False) -> User:
        user = await self._repo.get_user(user_id, for_update=for_update)
        if user is None:
            raise AppError(
                status_code=404,
                code="USER_NOT_FOUND",
                detail="Utilisateur introuvable.",
            )
        return user

    @staticmethod
    def _campaign_response(campaign: PresenceCampaign) -> PresenceCampaignResponse:
        return PresenceCampaignResponse.model_validate(
            {
                "id": campaign.id,
                "organization_id": campaign.organization_id,
                "local_event_id": campaign.local_event_id,
                "city": campaign.city,
                "title": campaign.title,
                "status": campaign.status,
                "presence_opens_at": campaign.presence_opens_at,
                "presence_closes_at": campaign.presence_closes_at,
                "is_test": campaign.is_test,
                "created_at": campaign.created_at,
                "updated_at": campaign.updated_at,
            }
        )
