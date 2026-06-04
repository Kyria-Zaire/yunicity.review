"""Admin citizen reports read service (ADMIN-07B)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import PostType
from app.core.report_admin_constants import (
    REPORT_ADMIN_LIST_PAGE_SIZE_MAX,
    REPORT_REASONS,
    REPORT_STATUSES,
)
from app.repositories.admin_report_repository import (
    AdminReportDetailRow,
    AdminReportListRow,
    AdminReportRepository,
)
from app.schemas.admin_report import (
    AdminReportDetailResponse,
    AdminReportListItem,
    AdminReportListResponse,
    AdminReportReporterSummary,
    AdminReportResolverSummary,
    AdminReportStatusSummary,
    AdminReportTargetPostSummary,
    AdminReportTargetType,
)

_POST_TYPE_TO_TARGET: dict[str, AdminReportTargetType] = {
    PostType.POST.value: "post",
    PostType.OFFER.value: "offer",
    PostType.EVENT.value: "event",
    PostType.PARTNER_CREATOR.value: "partner_creator",
}


class AdminReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminReportRepository(session)

    async def list_reports(
        self,
        *,
        status: str | None,
        reason: str | None,
        page: int,
        page_size: int,
    ) -> AdminReportListResponse:
        if status is not None and status not in REPORT_STATUSES:
            raise AppError(
                status_code=422,
                code="REPORT_STATUS_INVALID",
                detail="Statut de signalement invalide.",
            )
        if reason is not None and reason not in REPORT_REASONS:
            raise AppError(
                status_code=422,
                code="REPORT_REASON_INVALID",
                detail="Motif de signalement invalide.",
            )

        resolved_page_size = min(max(page_size, 1), REPORT_ADMIN_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_reports(
            status=status,
            reason=reason,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        summary_raw = await self._repo.fetch_status_summary()
        return AdminReportListResponse(
            items=[self._to_list_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
            summary=AdminReportStatusSummary(
                total=summary_raw.total,
                pending=summary_raw.pending,
                resolved=summary_raw.resolved,
                dismissed=summary_raw.dismissed,
            ),
        )

    async def get_report_detail(self, report_id: uuid.UUID) -> AdminReportDetailResponse:
        row = await self._repo.get_report_detail(report_id)
        if row is None:
            raise AppError(
                status_code=404,
                code="REPORT_NOT_FOUND",
                detail="Signalement introuvable.",
            )
        return self._to_detail(row)

    @staticmethod
    def _user_display_name(
        user: object,
        profile: object | None,
    ) -> str | None:
        display_name = getattr(profile, "display_name", None) if profile is not None else None
        if isinstance(display_name, str) and display_name.strip():
            return display_name.strip()
        full_name = getattr(user, "full_name", None)
        if isinstance(full_name, str) and full_name.strip():
            return full_name.strip()
        return None

    @classmethod
    def _to_reporter(
        cls,
        row: AdminReportListRow | AdminReportDetailRow,
    ) -> AdminReportReporterSummary:
        return AdminReportReporterSummary(
            id=row.reporter.id,
            email=row.reporter.email,
            display_name=cls._user_display_name(row.reporter, row.reporter_profile),
        )

    @classmethod
    def _to_resolver(cls, row: AdminReportDetailRow) -> AdminReportResolverSummary | None:
        if row.resolver is None:
            return None
        return AdminReportResolverSummary(
            id=row.resolver.id,
            email=row.resolver.email,
            display_name=cls._user_display_name(row.resolver, row.resolver_profile),
        )

    @classmethod
    def _target_type_from_post(cls, post_type: str) -> AdminReportTargetType:
        mapped = _POST_TYPE_TO_TARGET.get(post_type)
        if mapped is None:
            raise AppError(
                status_code=500,
                code="REPORT_TARGET_TYPE_INVALID",
                detail="Type de publication signalée invalide en base.",
            )
        return mapped

    @staticmethod
    def _body_excerpt(body: str | None, *, max_length: int = 200) -> str | None:
        if not body or not body.strip():
            return None
        text = body.strip().replace("\n", " ")
        if len(text) <= max_length:
            return text
        return f"{text[:max_length]}…"

    @classmethod
    def _to_list_item(cls, row: AdminReportListRow) -> AdminReportListItem:
        report = row.report
        target_type = cls._target_type_from_post(
            row.post.type.value if hasattr(row.post.type, "value") else str(row.post.type)
        )
        return AdminReportListItem(
            id=report.id,
            reason=report.reason,  # type: ignore[arg-type]
            status=report.status,  # type: ignore[arg-type]
            reporter=cls._to_reporter(row),
            target_type=target_type,
            target_id=report.post_id,
            created_at=report.created_at,
        )

    @classmethod
    def _to_detail(cls, row: AdminReportDetailRow) -> AdminReportDetailResponse:
        report = row.report
        post = row.post
        post_type_raw = post.type.value if hasattr(post.type, "value") else str(post.type)
        target_type = cls._target_type_from_post(post_type_raw)
        return AdminReportDetailResponse(
            id=report.id,
            reason=report.reason,  # type: ignore[arg-type]
            status=report.status,  # type: ignore[arg-type]
            created_at=report.created_at,
            resolved_at=report.resolved_at,
            reporter=cls._to_reporter(row),
            resolver=cls._to_resolver(row),
            target_type=target_type,
            target_id=report.post_id,
            target_post=AdminReportTargetPostSummary(
                id=post.id,
                type=target_type,
                title=post.title,
                body_excerpt=AdminReportService._body_excerpt(post.body),
                is_active=post.is_active,
                author_type=post.author_type,
                author_id=post.author_id,
                city=post.city,
            ),
        )
