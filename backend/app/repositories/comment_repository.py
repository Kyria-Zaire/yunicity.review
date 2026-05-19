"""Comment persistence (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment


class CommentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, comment_id: uuid.UUID) -> Comment | None:
        result = await self._session.execute(
            select(Comment)
            .where(Comment.id == comment_id)
            .options(selectinload(Comment.user))
        )
        return result.scalar_one_or_none()

    async def add(self, comment: Comment) -> Comment:
        self._session.add(comment)
        await self._session.flush()
        return comment

    async def list_for_post(
        self,
        post_id: uuid.UUID,
        *,
        limit: int,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
    ) -> list[Comment]:
        stmt = (
            select(Comment)
            .where(Comment.post_id == post_id, Comment.deleted_at.is_(None))
            .options(selectinload(Comment.user))
            .order_by(Comment.created_at.asc(), Comment.id.asc())
            .limit(limit + 1)
        )
        if cursor_created_at is not None and cursor_id is not None:
            stmt = stmt.where(
                or_(
                    Comment.created_at > cursor_created_at,
                    and_(
                        Comment.created_at == cursor_created_at,
                        Comment.id > cursor_id,
                    ),
                )
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
