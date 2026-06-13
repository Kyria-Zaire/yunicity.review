"""Local Video feed persistence (FEATURE-CREATORS-V2 / C2-S2-00)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.local_video_constants import LocalVideoStatus
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.user import User


class LocalVideoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_published_feed(
        self,
        *,
        city: str,
        limit: int,
        cursor_published_at: datetime | None = None,
        cursor_id: uuid.UUID | None = None,
    ) -> list[LocalVideo]:
        stmt = (
            select(LocalVideo)
            .join(User, LocalVideo.author_user_id == User.id)
            .join(Neighborhood, LocalVideo.neighborhood_id == Neighborhood.id)
            .where(
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
                LocalVideo.city.ilike(city.strip()),
                User.is_active.is_(True),
                Neighborhood.is_active.is_(True),
                LocalVideo.published_at.is_not(None),
            )
            .options(
                selectinload(LocalVideo.author).selectinload(User.profile),
                selectinload(LocalVideo.neighborhood),
                selectinload(LocalVideo.cultural_place),
                selectinload(LocalVideo.local_event),
                selectinload(LocalVideo.tribe),
            )
            .order_by(
                LocalVideo.published_at.desc(),
                LocalVideo.created_at.desc(),
                LocalVideo.id.desc(),
            )
            .limit(limit)
        )

        if cursor_published_at is not None and cursor_id is not None:
            stmt = stmt.where(
                or_(
                    LocalVideo.published_at < cursor_published_at,
                    and_(
                        LocalVideo.published_at == cursor_published_at,
                        LocalVideo.id < cursor_id,
                    ),
                )
            )

        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_published_by_id(self, video_id: uuid.UUID) -> LocalVideo | None:
        result = await self._session.execute(
            select(LocalVideo).where(
                LocalVideo.id == video_id,
                LocalVideo.status == LocalVideoStatus.PUBLISHED.value,
            )
        )
        return result.scalar_one_or_none()

    async def increment_like_count(self, video_id: uuid.UUID, delta: int) -> None:
        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.like_count = max(0, video.like_count + delta)

    async def increment_comment_count(self, video_id: uuid.UUID, delta: int) -> None:
        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.comment_count = max(0, video.comment_count + delta)

    async def increment_report_count(self, video_id: uuid.UUID) -> None:
        from app.core.local_video_constants import LOCAL_VIDEO_REPORT_REVIEW_PRIORITY_THRESHOLD

        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            return
        video.report_count = max(0, video.report_count + 1)
        if video.report_count >= LOCAL_VIDEO_REPORT_REVIEW_PRIORITY_THRESHOLD:
            video.review_priority = True
