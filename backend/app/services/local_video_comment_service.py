"""Local Video comments (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_cursor import decode_comment_cursor, encode_comment_cursor
from app.core.local_video_constants import (
    LOCAL_VIDEO_COMMENT_PAGE_DEFAULT,
    LOCAL_VIDEO_COMMENT_PAGE_MAX,
)
from app.models.local_video_social import LocalVideoComment
from app.models.user import User
from app.repositories.local_video_comment_repository import LocalVideoCommentRepository
from app.repositories.local_video_repository import LocalVideoRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.local_video import (
    LocalVideoCommentCreateRequest,
    LocalVideoCommentListResponse,
    LocalVideoCommentResponse,
)
from app.services.rbac_service import RbacService


class LocalVideoCommentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._videos = LocalVideoRepository(session)
        self._comments = LocalVideoCommentRepository(session)
        self._profiles = ProfileRepository(session)
        self._rbac = RbacService(session)

    async def list_comments(
        self,
        video_id: uuid.UUID,
        *,
        cursor: str | None,
        limit: int = LOCAL_VIDEO_COMMENT_PAGE_DEFAULT,
    ) -> LocalVideoCommentListResponse:
        video = await self._videos.get_published_by_id(video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        limit = min(max(limit, 1), LOCAL_VIDEO_COMMENT_PAGE_MAX)
        cursor_created_at = None
        cursor_id = None
        if cursor:
            cursor_created_at, cursor_id = decode_comment_cursor(cursor)
        rows = await self._comments.list_for_video(
            video_id,
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
        return LocalVideoCommentListResponse(items=items, next_cursor=next_cursor)

    async def create_comment(
        self,
        user: User,
        video_id: uuid.UUID,
        payload: LocalVideoCommentCreateRequest,
    ) -> LocalVideoCommentResponse:
        video = await self._videos.get_published_by_id(video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        comment = LocalVideoComment(
            video_id=video_id,
            author_user_id=user.id,
            body=payload.body,
        )
        await self._comments.add(comment)
        await self._videos.increment_comment_count(video_id, 1)
        await self._session.commit()
        await self._session.refresh(comment)
        return await self._to_response(comment)

    async def soft_delete_comment(self, user: User, comment_id: uuid.UUID) -> None:
        comment = await self._comments.get_by_id(comment_id)
        if comment is None or comment.is_deleted:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_COMMENT_NOT_FOUND",
                detail="Commentaire introuvable.",
            )
        if not await self._can_delete(user, comment):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Action non autorisée.",
            )
        comment.deleted_at = datetime.now(UTC)
        video = await self._videos.get_published_by_id(comment.video_id)
        if video is not None:
            await self._videos.increment_comment_count(comment.video_id, -1)
        await self._session.commit()

    async def _can_delete(self, user: User, comment: LocalVideoComment) -> bool:
        if comment.author_user_id == user.id:
            return True
        ctx = await self._rbac.get_user_rbac_context(user.id)
        return "moderation.manage" in ctx.permissions or "system.admin" in ctx.permissions

    async def _to_response(self, comment: LocalVideoComment) -> LocalVideoCommentResponse:
        profile = await self._profiles.get_by_user_id(comment.author_user_id)
        display = profile.display_name if profile and profile.display_name else "Citoyen"
        return LocalVideoCommentResponse(
            id=comment.id,
            video_id=comment.video_id,
            author_user_id=comment.author_user_id,
            author_display_name=display,
            author_username=profile.username if profile else None,
            body=comment.body,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
