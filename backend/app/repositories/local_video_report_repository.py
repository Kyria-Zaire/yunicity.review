"""Local Video report persistence (FEATURE-CREATORS-V2 / C2-S3-01)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.local_video_social import LocalVideoReport


class LocalVideoReportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_and_video(
        self,
        *,
        user_id: uuid.UUID,
        video_id: uuid.UUID,
    ) -> LocalVideoReport | None:
        result = await self._session.execute(
            select(LocalVideoReport).where(
                LocalVideoReport.user_id == user_id,
                LocalVideoReport.video_id == video_id,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, report: LocalVideoReport) -> LocalVideoReport:
        self._session.add(report)
        await self._session.flush()
        return report
