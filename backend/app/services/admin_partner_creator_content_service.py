"""Admin partner creator content staff read service (ADMIN-06D-A)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_content_admin_constants import (
    CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    CREATOR_CONTENT_ADMIN_ACTIONS,
)
from app.core.errors import AppError
from app.repositories.admin_partner_creator_content_repository import (
    AdminCreatorContentActionRow,
    AdminPartnerCreatorContentRepository,
)
from app.schemas.admin_partner_creator_content import (
    AdminPartnerCreatorContentActionItem,
    AdminPartnerCreatorContentActionListResponse,
    AdminPartnerCreatorContentActorSummary,
)


class AdminPartnerCreatorContentService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminPartnerCreatorContentRepository(session)

    async def list_content_actions(
        self,
        *,
        content_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> AdminPartnerCreatorContentActionListResponse:
        if not await self._repo.content_exists(content_id):
            raise AppError(
                status_code=404,
                code="CREATOR_CONTENT_NOT_FOUND",
                detail="Contenu créateur introuvable.",
            )

        resolved_page_size = min(
            max(page_size, 1),
            CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
        )
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_admin_actions(
            creator_content_id=content_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminPartnerCreatorContentActionListResponse(
            items=[self._to_action_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    def _to_action_item(
        self,
        row: AdminCreatorContentActionRow,
    ) -> AdminPartnerCreatorContentActionItem:
        entry = row.action
        if entry.action not in CREATOR_CONTENT_ADMIN_ACTIONS:
            raise AppError(
                status_code=500,
                code="INVALID_CREATOR_CONTENT_ADMIN_ACTION",
                detail="Action staff contenu créateur invalide en base.",
            )
        return AdminPartnerCreatorContentActionItem(
            id=entry.id,
            action=entry.action,  # type: ignore[arg-type]
            previous_status=entry.previous_status,
            new_status=entry.new_status,
            reason=entry.reason,
            actor_user=self._to_action_actor(row),
            created_at=entry.created_at,
        )

    @staticmethod
    def _to_action_actor(
        row: AdminCreatorContentActionRow,
    ) -> AdminPartnerCreatorContentActorSummary:
        actor = row.actor
        if actor is None:
            assert row.action.actor_user_id is not None
            return AdminPartnerCreatorContentActorSummary(
                id=row.action.actor_user_id,
                email="Compte staff supprimé",
                display_name=None,
            )
        display_name: str | None = None
        if row.actor_profile is not None and row.actor_profile.display_name:
            display_name = row.actor_profile.display_name
        elif actor.full_name:
            display_name = actor.full_name
        return AdminPartnerCreatorContentActorSummary(
            id=actor.id,
            email=actor.email,
            display_name=display_name,
        )
