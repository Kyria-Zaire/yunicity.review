"""User notification persistence (TICKET-503)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.social_notification_constants import SocialNotificationType
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
        result = await self._session.execute(
            select(func.count())
            .select_from(UserNotification)
            .where(
                UserNotification.target_user_id == user_id,
                UserNotification.is_read.is_(False),
            )
        )
        return int(result.scalar_one())

    async def fetch_inbox_summary_counts(
        self,
        user_id: uuid.UUID,
        *,
        week_start: datetime,
        month_start: datetime,
    ) -> dict[str, int]:
        unread = UserNotification.is_read.is_(False)
        payload_category = UserNotification.payload["category"].as_string()
        notification_type = UserNotification.type

        social_unread = case(
            (
                unread
                & notification_type.in_(
                    (
                        SocialNotificationType.POST_LIKED.value,
                        SocialNotificationType.POST_COMMENTED.value,
                    )
                ),
                1,
            ),
            else_=0,
        )
        events_unread = case(
            (
                unread
                & or_(
                    notification_type == SocialNotificationType.LOCAL_EVENT_PUBLISHED.value,
                    payload_category == "events",
                ),
                1,
            ),
            else_=0,
        )
        passport_unread = case(
            (
                unread
                & or_(
                    notification_type.in_(
                        (
                            SocialNotificationType.PASSPORT_LEVEL_UNLOCKED.value,
                            SocialNotificationType.LOCAL_STAMP_EARNED.value,
                        )
                    ),
                    payload_category == "passport",
                ),
                1,
            ),
            else_=0,
        )
        system_unread = case(
            (
                unread
                & UserNotification.actor_id.is_(None)
                & (notification_type != SocialNotificationType.LOCAL_EVENT_PUBLISHED.value),
                1,
            ),
            else_=0,
        )
        week_count = case((UserNotification.created_at >= week_start, 1), else_=0)
        month_count = case((UserNotification.created_at >= month_start, 1), else_=0)

        result = await self._session.execute(
            select(
                func.coalesce(func.sum(case((unread, 1), else_=0)), 0).label("unread_count"),
                func.coalesce(func.sum(social_unread), 0).label("unread_social"),
                func.coalesce(func.sum(events_unread), 0).label("unread_events"),
                func.coalesce(func.sum(passport_unread), 0).label("unread_passport"),
                func.coalesce(func.sum(system_unread), 0).label("unread_system"),
                func.coalesce(func.sum(week_count), 0).label("count_this_week"),
                func.coalesce(func.sum(month_count), 0).label("count_this_month"),
            ).where(UserNotification.target_user_id == user_id)
        )
        row = result.one()
        return {
            "unread_count": int(row.unread_count),
            "unread_mentions": 0,
            "unread_social": int(row.unread_social),
            "unread_events": int(row.unread_events),
            "unread_passport": int(row.unread_passport),
            "unread_system": int(row.unread_system),
            "count_this_week": int(row.count_this_week),
            "count_this_month": int(row.count_this_month),
        }

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
