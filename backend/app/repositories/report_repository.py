"""Report persistence (TICKET-402)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report


class ReportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, report: Report) -> Report:
        self._session.add(report)
        await self._session.flush()
        return report

    async def get_pending_by_user_and_post(
        self,
        *,
        user_id: uuid.UUID,
        post_id: uuid.UUID,
    ) -> Report | None:
        result = await self._session.execute(
            select(Report).where(
                Report.user_id == user_id,
                Report.post_id == post_id,
                Report.status == "pending",
            )
        )
        return result.scalar_one_or_none()
