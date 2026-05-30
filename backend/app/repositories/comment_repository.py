"""Comment persistence (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.user_profile import UserProfile


class CommentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, comment_id: uuid.UUID) -> Comment | None:
        result = await self._session.execute(
            select(Comment).where(Comment.id == comment_id).options(selectinload(Comment.user))
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

    async def latest_activity_by_post(
        self, post_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, datetime]:
        if not post_ids:
            return {}
        result = await self._session.execute(
            select(Comment.post_id, func.max(Comment.created_at))
            .where(Comment.post_id.in_(post_ids), Comment.deleted_at.is_(None))
            .group_by(Comment.post_id)
        )
        return {row[0]: row[1] for row in result.all()}

    async def recent_participants_by_post(
        self,
        post_ids: list[uuid.UUID],
        *,
        per_post: int = 4,
    ) -> dict[uuid.UUID, list[tuple[str | None, str]]]:
        if not post_ids:
            return {}
        result = await self._session.execute(
            select(
                Comment.post_id,
                UserProfile.display_name,
                UserProfile.avatar_url,
                Comment.created_at,
            )
            .join(UserProfile, UserProfile.user_id == Comment.user_id)
            .where(Comment.post_id.in_(post_ids), Comment.deleted_at.is_(None))
            .order_by(Comment.post_id, Comment.created_at.desc())
        )
        buckets: dict[uuid.UUID, list[tuple[str | None, str]]] = {pid: [] for pid in post_ids}
        seen: dict[uuid.UUID, set[str]] = {pid: set() for pid in post_ids}
        for post_id, display_name, avatar_url, _created_at in result.all():
            name = (display_name or "").strip()
            if not name:
                continue
            if name in seen[post_id]:
                continue
            if len(buckets[post_id]) >= per_post:
                continue
            seen[post_id].add(name)
            buckets[post_id].append((avatar_url, name))
        return buckets
