"""Post likes (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.like import Like
from app.repositories.like_repository import LikeRepository
from app.repositories.post_repository import PostRepository
from app.services.social_notification_hooks import notify_post_liked


class LikeService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._likes = LikeRepository(session)

    async def like_post(self, user_id: uuid.UUID, post_id: uuid.UUID) -> None:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        existing = await self._likes.get(user_id=user_id, post_id=post_id)
        if existing is not None:
            return
        try:
            await self._likes.add(Like(user_id=user_id, post_id=post_id))
            await self._posts.increment_like_count(post_id, 1)
            await self._session.commit()
            await notify_post_liked(self._session, actor_id=user_id, post=post)
        except IntegrityError:
            await self._session.rollback()

    async def unlike_post(self, user_id: uuid.UUID, post_id: uuid.UUID) -> None:
        post = await self._posts.get_by_id(post_id)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        existing = await self._likes.get(user_id=user_id, post_id=post_id)
        if existing is None:
            return
        await self._likes.delete(existing)
        if post.is_active:
            await self._posts.increment_like_count(post_id, -1)
        await self._session.commit()
