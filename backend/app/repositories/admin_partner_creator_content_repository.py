"""Admin partner creator content audit persistence (ADMIN-06D-A)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.creator_content_admin_action import CreatorContentAdminAction
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.user import User
from app.models.user_profile import UserProfile


@dataclass(frozen=True)
class AdminCreatorContentActionRow:
    action: CreatorContentAdminAction
    actor: User | None
    actor_profile: UserProfile | None


class AdminPartnerCreatorContentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def content_exists(self, content_id: uuid.UUID) -> bool:
        stmt = (
            select(func.count())
            .select_from(PartnerCreatorContent)
            .where(PartnerCreatorContent.id == content_id)
        )
        return int((await self._session.execute(stmt)).scalar_one()) > 0

    async def count_admin_actions(self, creator_content_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(CreatorContentAdminAction)
            .where(CreatorContentAdminAction.creator_content_id == creator_content_id)
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def record_admin_action(
        self,
        *,
        creator_content_id: uuid.UUID,
        action: str,
        actor_user_id: uuid.UUID,
        previous_status: str | None,
        new_status: str | None,
        reason: str | None,
        metadata: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> CreatorContentAdminAction:
        entry = CreatorContentAdminAction(
            creator_content_id=creator_content_id,
            action=action,
            actor_user_id=actor_user_id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata_=metadata,
            created_at=created_at or datetime.now(UTC),
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list_admin_actions(
        self,
        *,
        creator_content_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminCreatorContentActionRow], int]:
        filters = [CreatorContentAdminAction.creator_content_id == creator_content_id]
        count_stmt = select(func.count()).select_from(CreatorContentAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(CreatorContentAdminAction, User, UserProfile)
            .outerjoin(User, CreatorContentAdminAction.actor_user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(
                CreatorContentAdminAction.created_at.desc(),
                CreatorContentAdminAction.id.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminCreatorContentActionRow(
                action=row[0],
                actor=row[1] if isinstance(row[1], User) else None,
                actor_profile=row[2] if isinstance(row[2], UserProfile) else None,
            )
            for row in result.all()
        ]
        return rows, total
