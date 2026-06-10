"""Admin citizen reports service (ADMIN-07B / ADMIN-07D-A)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.feed_constants import PostType, ReportStatus
from app.core.report_admin_constants import (
    REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    REPORT_ADMIN_LIST_PAGE_SIZE_MAX,
    REPORT_REASONS,
    REPORT_RESOLUTION_NOTE_HIDE_POST_MIN_LENGTH,
    REPORT_RESOLUTION_NOTE_MAX_LENGTH,
    REPORT_STATUSES,
    ReportAdminActionType,
)
from app.models.user import User
from app.repositories.admin_report_repository import (
    AdminReportActionListRow,
    AdminReportDetailRow,
    AdminReportListRow,
    AdminReportRepository,
)
from app.schemas.admin_report import (
    AdminReportActionActorSummary,
    AdminReportActionListItem,
    AdminReportActionListResponse,
    AdminReportAdminSummaryResponse,
    AdminReportDetailResponse,
    AdminReportListItem,
    AdminReportListResponse,
    AdminReportReason,
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
        self._session = session
        self._repo = AdminReportRepository(session)

    async def get_reports_admin_summary(self) -> AdminReportAdminSummaryResponse:
        counts = await self._repo.fetch_admin_summary()
        dominant_reason: AdminReportReason | None = None
        if counts.dominant_reason is not None and counts.dominant_reason in REPORT_REASONS:
            dominant_reason = cast(AdminReportReason, counts.dominant_reason)
        return AdminReportAdminSummaryResponse(
            generated_at=datetime.now(UTC),
            total=counts.total,
            pending=counts.pending,
            resolved=counts.resolved,
            dismissed=counts.dismissed,
            dominant_reason=dominant_reason,
        )

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

    async def dismiss_report(
        self,
        actor: User,
        report_id: uuid.UUID,
        *,
        reason: str | None,
    ) -> AdminReportDetailResponse:
        normalized_reason = self._normalize_resolution_note(reason)
        return await self._close_report(
            actor=actor,
            report_id=report_id,
            action=ReportAdminActionType.DISMISS,
            new_status=ReportStatus.DISMISSED.value,
            hide_post=False,
            reason=normalized_reason,
        )

    async def resolve_report(
        self,
        actor: User,
        report_id: uuid.UUID,
        *,
        reason: str | None,
        hide_post: bool,
    ) -> AdminReportDetailResponse:
        normalized_reason = self._normalize_resolution_note(reason)
        if hide_post:
            self._require_hide_post_reason(normalized_reason)
            action = ReportAdminActionType.RESOLVE_HIDE_POST
            new_status = ReportStatus.ACTION_TAKEN.value
        else:
            action = ReportAdminActionType.RESOLVE
            new_status = ReportStatus.REVIEWED.value
        return await self._close_report(
            actor=actor,
            report_id=report_id,
            action=action,
            new_status=new_status,
            hide_post=hide_post,
            reason=normalized_reason,
        )

    async def list_report_actions(
        self,
        report_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> AdminReportActionListResponse:
        if not await self._repo.report_exists(report_id):
            raise AppError(
                status_code=404,
                code="REPORT_NOT_FOUND",
                detail="Signalement introuvable.",
            )
        resolved_page_size = min(max(page_size, 1), REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
        resolved_page = max(page, 1)
        rows, total = await self._repo.list_admin_actions(
            report_id=report_id,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        return AdminReportActionListResponse(
            items=[self._to_action_item(row) for row in rows],
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    async def _close_report(
        self,
        *,
        actor: User,
        report_id: uuid.UUID,
        action: ReportAdminActionType,
        new_status: str,
        hide_post: bool,
        reason: str | None,
    ) -> AdminReportDetailResponse:
        report = await self._repo.get_report_for_update(report_id)
        if report is None:
            raise AppError(
                status_code=404,
                code="REPORT_NOT_FOUND",
                detail="Signalement introuvable.",
            )
        if report.status != ReportStatus.PENDING.value:
            raise AppError(
                status_code=409,
                code="REPORT_ALREADY_CLOSED",
                detail="Ce signalement a déjà été traité.",
            )
        post = report.post
        if post is None:
            raise AppError(
                status_code=404,
                code="REPORT_NOT_FOUND",
                detail="Signalement introuvable.",
            )

        previous_status = report.status
        now = datetime.now(UTC)
        report.status = new_status
        report.resolved_at = now
        report.resolved_by = actor.id
        report.resolution_note = reason

        metadata: dict[str, object] | None = None
        if hide_post:
            post.is_active = False
            metadata = {
                "hide_post": True,
                "post_id": str(post.id),
            }

        await self._repo.add_admin_action(
            report_id=report.id,
            actor_user_id=actor.id,
            action=action.value,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata=metadata,
        )
        await self._session.commit()

        row = await self._repo.get_report_detail(report_id)
        assert row is not None
        return self._to_detail(row)

    @staticmethod
    def _normalize_resolution_note(raw: str | None) -> str | None:
        if raw is None:
            return None
        trimmed = raw.strip()
        if not trimmed:
            return None
        if len(trimmed) > REPORT_RESOLUTION_NOTE_MAX_LENGTH:
            raise AppError(
                status_code=422,
                code="REPORT_REASON_TOO_LONG",
                detail="La note de résolution est trop longue.",
            )
        return trimmed

    @staticmethod
    def _require_hide_post_reason(reason: str | None) -> None:
        if reason is None:
            raise AppError(
                status_code=422,
                code="REPORT_REASON_REQUIRED",
                detail="Une note staff est requise pour masquer le contenu.",
            )
        if len(reason) < REPORT_RESOLUTION_NOTE_HIDE_POST_MIN_LENGTH:
            raise AppError(
                status_code=422,
                code="REPORT_REASON_TOO_SHORT",
                detail="La note staff doit contenir au moins 3 caractères.",
            )

    @classmethod
    def _to_action_item(cls, row: AdminReportActionListRow) -> AdminReportActionListItem:
        actor_summary: AdminReportActionActorSummary | None = None
        if row.actor is not None:
            actor_summary = AdminReportActionActorSummary(
                id=row.actor.id,
                email=row.actor.email,
                display_name=cls._user_display_name(row.actor, row.actor_profile),
            )
        return AdminReportActionListItem(
            action=row.action.action,
            previous_status=row.action.previous_status,
            new_status=row.action.new_status,
            reason=row.action.reason,
            actor_user=actor_summary,
            created_at=row.action.created_at,
        )

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
            resolution_note=report.resolution_note,
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
