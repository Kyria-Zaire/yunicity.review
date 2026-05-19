"""Post comments (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import FEED_PAGE_SIZE_DEFAULT, FEED_PAGE_SIZE_MAX
from app.core.feed_cursor import decode_comment_cursor, encode_comment_cursor
from app.models.comment import Comment
from app.models.user import User
from app.repositories.comment_repository import CommentRepository
from app.repositories.post_repository import PostRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.post import CommentCreateRequest, CommentListResponse, CommentResponse
from app.services.rbac_service import RbacService


class CommentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._comments = CommentRepository(session)
        self._profiles = ProfileRepository(session)
        self._rbac = RbacService(session)

    async def list_comments(
        self,
        post_id: uuid.UUID,
        *,
        cursor: str | None,
        limit: int = FEED_PAGE_SIZE_DEFAULT,
    ) -> CommentListResponse:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        limit = min(limit, FEED_PAGE_SIZE_MAX)
        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_created_at, cursor_id = decode_comment_cursor(cursor)
        rows = await self._comments.list_for_post(
            post_id,
            limit=limit,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )
        has_more = len(rows) > limit
        page = rows[:limit]
        items = [await self._to_response(comment) for comment in page]
        next_cursor = None
        if has_more and page:
            last = page[-1]
            next_cursor = encode_comment_cursor(last.created_at, last.id)
        return CommentListResponse(items=items, next_cursor=next_cursor)

    async def create_comment(
        self,
        user: User,
        post_id: uuid.UUID,
        payload: CommentCreateRequest,
    ) -> CommentResponse:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        comment = Comment(user_id=user.id, post_id=post_id, body=payload.body)
        await self._comments.add(comment)
        await self._posts.increment_comment_count(post_id, 1)
        await self._session.commit()
        await self._session.refresh(comment)
        return await self._to_response(comment)

    async def soft_delete_comment(self, user: User, comment_id: uuid.UUID) -> None:
        comment = await self._comments.get_by_id(comment_id)
        if comment is None or comment.is_deleted:
            raise AppError(
                status_code=404,
                code="COMMENT_NOT_FOUND",
                detail="Commentaire introuvable.",
            )
        if not await self._can_delete(user, comment):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Action non autorisée.",
            )
        comment.deleted_at = datetime.now(UTC)
        post = await self._posts.get_by_id(comment.post_id)
        if post is not None and post.is_active:
            await self._posts.increment_comment_count(comment.post_id, -1)
        await self._session.commit()

    async def _can_delete(self, user: User, comment: Comment) -> bool:
        if comment.user_id == user.id:
            return True
        ctx = await self._rbac.get_user_rbac_context(user.id)
        return "moderation.manage" in ctx.permissions or "system.admin" in ctx.permissions

    async def _to_response(self, comment: Comment) -> CommentResponse:
        profile = await self._profiles.get_by_user_id(comment.user_id)
        display = profile.display_name if profile and profile.display_name else "Citoyen"
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            author_display_name=display,
            author_username=profile.username if profile else None,
            body=comment.body,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
