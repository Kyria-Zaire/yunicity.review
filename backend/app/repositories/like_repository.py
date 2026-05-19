"""Like persistence (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.like import Like


class LikeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, *, user_id: uuid.UUID, post_id: uuid.UUID) -> Like | None:
        result = await self._session.execute(
            select(Like).where(Like.user_id == user_id, Like.post_id == post_id)
        )
        return result.scalar_one_or_none()

    async def add(self, like: Like) -> Like:
        self._session.add(like)
        await self._session.flush()
        return like

    async def delete(self, like: Like) -> None:
        await self._session.delete(like)

    async def list_liked_post_ids(
        self,
        user_id: uuid.UUID,
        post_ids: list[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not post_ids:
            return set()
        result = await self._session.execute(
            select(Like.post_id).where(
                Like.user_id == user_id,
                Like.post_id.in_(post_ids),
            )
        )
        return {row[0] for row in result.all()}
