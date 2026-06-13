"""Local Video comment persistence (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.local_video_social import LocalVideoComment


class LocalVideoCommentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, comment_id: uuid.UUID) -> LocalVideoComment | None:
        result = await self._session.execute(
            select(LocalVideoComment)
            .where(LocalVideoComment.id == comment_id)
            .options(selectinload(LocalVideoComment.author))
        )
        return result.scalar_one_or_none()

    async def add(self, comment: LocalVideoComment) -> LocalVideoComment:
        self._session.add(comment)
        await self._session.flush()
        return comment

    async def list_for_video(
        self,
        video_id: uuid.UUID,
        *,
        limit: int,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
    ) -> list[LocalVideoComment]:
        stmt = (
            select(LocalVideoComment)
            .where(
                LocalVideoComment.video_id == video_id,
                LocalVideoComment.deleted_at.is_(None),
            )
            .options(selectinload(LocalVideoComment.author))
            .order_by(LocalVideoComment.created_at.asc(), LocalVideoComment.id.asc())
            .limit(limit + 1)
        )
        if cursor_created_at is not None and cursor_id is not None:
            stmt = stmt.where(
                or_(
                    LocalVideoComment.created_at > cursor_created_at,
                    and_(
                        LocalVideoComment.created_at == cursor_created_at,
                        LocalVideoComment.id > cursor_id,
                    ),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
