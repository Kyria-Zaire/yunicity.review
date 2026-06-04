"""Admin citizen reports read persistence (ADMIN-07B)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.feed_constants import ReportStatus
from app.models.post import Post
from app.models.report import Report
from app.models.report_admin_action import ReportAdminAction
from app.models.user import User
from app.models.user_profile import UserProfile


@dataclass(frozen=True)
class AdminReportListRow:
    report: Report
    reporter: User
    reporter_profile: UserProfile | None
    post: Post


@dataclass(frozen=True)
class AdminReportDetailRow:
    report: Report
    reporter: User
    reporter_profile: UserProfile | None
    resolver: User | None
    resolver_profile: UserProfile | None
    post: Post


@dataclass(frozen=True)
class AdminReportStatusCounts:
    total: int
    pending: int
    resolved: int
    dismissed: int


@dataclass(frozen=True)
class AdminReportActionListRow:
    action: ReportAdminAction
    actor: User | None
    actor_profile: UserProfile | None


class AdminReportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def fetch_status_summary(self) -> AdminReportStatusCounts:
        total_stmt = select(func.count()).select_from(Report)
        total = int((await self._session.execute(total_stmt)).scalar_one())

        async def _count_status(status: str) -> int:
            stmt = select(func.count()).select_from(Report).where(Report.status == status)
            return int((await self._session.execute(stmt)).scalar_one())

        pending = await _count_status(ReportStatus.PENDING.value)
        dismissed = await _count_status(ReportStatus.DISMISSED.value)
        reviewed = await _count_status(ReportStatus.REVIEWED.value)
        action_taken = await _count_status(ReportStatus.ACTION_TAKEN.value)
        return AdminReportStatusCounts(
            total=total,
            pending=pending,
            resolved=reviewed + action_taken,
            dismissed=dismissed,
        )

    async def list_reports(
        self,
        *,
        status: str | None,
        reason: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminReportListRow], int]:
        filters: list[Any] = []
        if status is not None:
            filters.append(Report.status == status)
        if reason is not None:
            filters.append(Report.reason == reason)

        count_stmt = select(func.count()).select_from(Report).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(Report, User, UserProfile, Post)
            .join(User, Report.user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .join(Post, Report.post_id == Post.id)
            .where(*filters)
            .order_by(Report.created_at.desc(), Report.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminReportListRow(
                report=row[0],
                reporter=row[1],
                reporter_profile=row[2] if isinstance(row[2], UserProfile) else None,
                post=row[3],
            )
            for row in result.all()
        ]
        return rows, total

    async def get_report_detail(self, report_id: uuid.UUID) -> AdminReportDetailRow | None:
        stmt = (
            select(Report)
            .options(
                joinedload(Report.reporter).joinedload(User.profile),
                joinedload(Report.resolver).joinedload(User.profile),
                joinedload(Report.post),
            )
            .where(Report.id == report_id)
        )
        result = await self._session.execute(stmt)
        report = result.unique().scalar_one_or_none()
        if report is None:
            return None
        reporter = report.reporter
        assert reporter is not None
        post = report.post
        assert post is not None
        resolver = report.resolver
        return AdminReportDetailRow(
            report=report,
            reporter=reporter,
            reporter_profile=reporter.profile,
            resolver=resolver,
            resolver_profile=resolver.profile if resolver is not None else None,
            post=post,
        )

    async def get_report_for_update(self, report_id: uuid.UUID) -> Report | None:
        stmt = select(Report).where(Report.id == report_id).with_for_update()
        result = await self._session.execute(stmt)
        report = result.scalar_one_or_none()
        if report is None:
            return None
        await self._session.refresh(report, attribute_names=["post"])
        return report

    async def add_admin_action(
        self,
        *,
        report_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        action: str,
        previous_status: str,
        new_status: str,
        reason: str | None,
        metadata: dict[str, object] | None = None,
    ) -> ReportAdminAction:
        entry = ReportAdminAction(
            report_id=report_id,
            actor_user_id=actor_user_id,
            action=action,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata_=metadata,
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list_admin_actions(
        self,
        *,
        report_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminReportActionListRow], int]:
        filters = [ReportAdminAction.report_id == report_id]
        count_stmt = select(func.count()).select_from(ReportAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(ReportAdminAction, User, UserProfile)
            .outerjoin(User, ReportAdminAction.actor_user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(ReportAdminAction.created_at.desc(), ReportAdminAction.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminReportActionListRow(
                action=row[0],
                actor=row[1] if isinstance(row[1], User) else None,
                actor_profile=row[2] if isinstance(row[2], UserProfile) else None,
            )
            for row in result.all()
        ]
        return rows, total

    async def report_exists(self, report_id: uuid.UUID) -> bool:
        stmt = select(Report.id).where(Report.id == report_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None
