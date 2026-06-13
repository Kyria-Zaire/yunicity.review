"""Local Video likes (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.local_video_social import LocalVideoLike
from app.repositories.local_video_like_repository import LocalVideoLikeRepository
from app.repositories.local_video_repository import LocalVideoRepository
from app.schemas.local_video import LocalVideoLikeResponse


class LocalVideoLikeService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._videos = LocalVideoRepository(session)
        self._likes = LocalVideoLikeRepository(session)

    async def like_video(self, user_id: uuid.UUID, video_id: uuid.UUID) -> LocalVideoLikeResponse:
        video = await self._videos.get_published_by_id(video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        existing = await self._likes.get(user_id=user_id, video_id=video_id)
        if existing is not None:
            await self._session.refresh(video)
            return LocalVideoLikeResponse(liked=True, like_count=video.like_count)
        try:
            await self._likes.add(LocalVideoLike(user_id=user_id, video_id=video_id))
            await self._videos.increment_like_count(video_id, 1)
            await self._session.commit()
        except IntegrityError:
            await self._session.rollback()
        video = await self._videos.get_published_by_id(video_id)
        assert video is not None
        return LocalVideoLikeResponse(liked=True, like_count=video.like_count)

    async def unlike_video(
        self,
        user_id: uuid.UUID,
        video_id: uuid.UUID,
    ) -> LocalVideoLikeResponse:
        video = await self._videos.get_published_by_id(video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        existing = await self._likes.get(user_id=user_id, video_id=video_id)
        if existing is None:
            return LocalVideoLikeResponse(liked=False, like_count=video.like_count)
        await self._likes.delete(existing)
        await self._videos.increment_like_count(video_id, -1)
        await self._session.commit()
        video = await self._videos.get_published_by_id(video_id)
        assert video is not None
        return LocalVideoLikeResponse(liked=False, like_count=video.like_count)
