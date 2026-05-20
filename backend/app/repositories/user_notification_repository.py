"""User notification persistence (TICKET-503)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user_notification import UserNotification


class UserNotificationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, row: UserNotification) -> UserNotification:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_by_id_for_user(
        self,
        notification_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> UserNotification | None:
        result = await self._session.execute(
            select(UserNotification)
            .options(selectinload(UserNotification.actor))
            .where(
                UserNotification.id == notification_id,
                UserNotification.target_user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        limit: int,
        unread_only: bool = False,
    ) -> list[UserNotification]:
        stmt = (
            select(UserNotification)
            .options(selectinload(UserNotification.actor))
            .where(UserNotification.target_user_id == user_id)
            .order_by(UserNotification.created_at.desc(), UserNotification.id.desc())
            .limit(limit)
        )
        if unread_only:
            stmt = stmt.where(UserNotification.is_read.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_unread(self, user_id: uuid.UUID) -> int:
        from sqlalchemy import func

        result = await self._session.execute(
            select(func.count())
            .select_from(UserNotification)
            .where(
                UserNotification.target_user_id == user_id,
                UserNotification.is_read.is_(False),
            )
        )
        return int(result.scalar_one())

    async def has_recent_duplicate(
        self,
        *,
        target_user_id: uuid.UUID,
        actor_id: uuid.UUID,
        notification_type: str,
        target_post_id: uuid.UUID | None,
        since: datetime,
    ) -> bool:
        stmt = select(UserNotification.id).where(
            UserNotification.target_user_id == target_user_id,
            UserNotification.actor_id == actor_id,
            UserNotification.type == notification_type,
            UserNotification.created_at >= since,
        )
        if target_post_id is not None:
            stmt = stmt.where(UserNotification.target_post_id == target_post_id)
        result = await self._session.execute(stmt.limit(1))
        return result.scalar_one_or_none() is not None

    async def mark_read(self, notification: UserNotification) -> None:
        notification.is_read = True
        await self._session.flush()

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            update(UserNotification)
            .where(
                UserNotification.target_user_id == user_id,
                UserNotification.is_read.is_(False),
            )
            .values(is_read=True)
        )
        rowcount = getattr(result, "rowcount", 0)
        return int(rowcount or 0)
