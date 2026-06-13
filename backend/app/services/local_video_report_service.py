"""Local Video reports (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.local_video_constants import LocalVideoReportStatus
from app.models.local_video_social import LocalVideoReport
from app.models.user import User
from app.repositories.local_video_report_repository import LocalVideoReportRepository
from app.repositories.local_video_repository import LocalVideoRepository
from app.schemas.local_video import LocalVideoReportCreateRequest


class LocalVideoReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._videos = LocalVideoRepository(session)
        self._reports = LocalVideoReportRepository(session)

    async def report_video(
        self,
        user: User,
        video_id: uuid.UUID,
        payload: LocalVideoReportCreateRequest,
    ) -> None:
        video = await self._videos.get_published_by_id(video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        existing = await self._reports.get_by_user_and_video(
            user_id=user.id,
            video_id=video_id,
        )
        if existing is not None:
            return
        try:
            await self._reports.add(
                LocalVideoReport(
                    user_id=user.id,
                    video_id=video_id,
                    reason=payload.reason.value,
                    status=LocalVideoReportStatus.PENDING.value,
                )
            )
            await self._videos.increment_report_count(video_id)
            await self._session.commit()
        except IntegrityError:
            await self._session.rollback()
