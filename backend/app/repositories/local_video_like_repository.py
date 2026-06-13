"""Local Video like persistence (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.local_video_social import LocalVideoLike


class LocalVideoLikeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, *, user_id: uuid.UUID, video_id: uuid.UUID) -> LocalVideoLike | None:
        result = await self._session.execute(
            select(LocalVideoLike).where(
                LocalVideoLike.user_id == user_id,
                LocalVideoLike.video_id == video_id,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, like: LocalVideoLike) -> LocalVideoLike:
        self._session.add(like)
        await self._session.flush()
        return like

    async def delete(self, like: LocalVideoLike) -> None:
        await self._session.delete(like)

    async def list_liked_video_ids(
        self,
        user_id: uuid.UUID,
        video_ids: list[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not video_ids:
            return set()
        result = await self._session.execute(
            select(LocalVideoLike.video_id).where(
                LocalVideoLike.user_id == user_id,
                LocalVideoLike.video_id.in_(video_ids),
            )
        )
        return {row[0] for row in result.all()}
