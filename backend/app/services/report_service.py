"""Post reports (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import ReportStatus
from app.models.report import Report
from app.models.user import User
from app.repositories.post_repository import PostRepository
from app.repositories.report_repository import ReportRepository
from app.schemas.post import ReportCreateRequest
from app.services.tribe_authorization import TribeAuthorizationService


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._posts = PostRepository(session)
        self._reports = ReportRepository(session)

    async def report_post(
        self,
        user: User,
        post_id: uuid.UUID,
        payload: ReportCreateRequest,
    ) -> None:
        post = await self._posts.get_by_id(post_id, active_only=True)
        if post is None:
            raise AppError(
                status_code=404,
                code="POST_NOT_FOUND",
                detail="Publication introuvable.",
            )
        await TribeAuthorizationService(self._session).require_can_interact_with_post(post, user)
        existing = await self._reports.get_pending_by_user_and_post(
            user_id=user.id,
            post_id=post_id,
        )
        if existing is not None:
            return
        report = Report(
            user_id=user.id,
            post_id=post_id,
            reason=payload.reason,
            status=ReportStatus.PENDING.value,
        )
        await self._reports.add(report)
        await self._session.commit()
