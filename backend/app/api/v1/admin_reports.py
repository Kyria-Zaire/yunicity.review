"""Admin citizen reports API (ADMIN-07B / ADMIN-07D-A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.errors import AppError
from app.core.feed_constants import ReportReason, ReportStatus
from app.core.report_admin_constants import (
    REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
    REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    REPORT_ADMIN_LIST_PAGE_SIZE_DEFAULT,
    REPORT_ADMIN_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_report import (
    AdminReportActionListResponse,
    AdminReportDetailResponse,
    AdminReportDismissRequest,
    AdminReportListResponse,
    AdminReportResolveRequest,
)
from app.services.admin_report_service import AdminReportService

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


def _parse_status_filter(raw: str | None) -> str | None:
    if raw is None or not raw.strip():
        return None
    normalized = raw.strip().lower()
    if normalized == "all":
        return None
    try:
        return ReportStatus(normalized).value
    except ValueError as exc:
        raise AppError(
            status_code=422,
            code="REPORT_STATUS_INVALID",
            detail="Statut de signalement invalide.",
        ) from exc


def _parse_reason_filter(raw: str | None) -> str | None:
    if raw is None or not raw.strip():
        return None
    try:
        return ReportReason(raw.strip().lower()).value
    except ValueError as exc:
        raise AppError(
            status_code=422,
            code="REPORT_REASON_INVALID",
            detail="Motif de signalement invalide.",
        ) from exc


@router.get("", response_model=AdminReportListResponse)
async def list_reports_admin(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(default=None),
    reason: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=REPORT_ADMIN_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=REPORT_ADMIN_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminReportListResponse:
    _ = current_user
    return await AdminReportService(session).list_reports(
        status=_parse_status_filter(status),
        reason=_parse_reason_filter(reason),
        page=page,
        page_size=page_size,
    )


@router.post("/{report_id}/dismiss", response_model=AdminReportDetailResponse)
async def dismiss_report_admin(
    report_id: uuid.UUID,
    payload: AdminReportDismissRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminReportDetailResponse:
    return await AdminReportService(session).dismiss_report(
        current_user,
        report_id,
        reason=payload.reason,
    )


@router.post("/{report_id}/resolve", response_model=AdminReportDetailResponse)
async def resolve_report_admin(
    report_id: uuid.UUID,
    payload: AdminReportResolveRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminReportDetailResponse:
    return await AdminReportService(session).resolve_report(
        current_user,
        report_id,
        reason=payload.reason,
        hide_post=payload.hide_post,
    )


@router.get("/{report_id}/actions", response_model=AdminReportActionListResponse)
async def list_report_actions_admin(
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminReportActionListResponse:
    _ = current_user
    return await AdminReportService(session).list_report_actions(
        report_id,
        page=page,
        page_size=page_size,
    )


@router.get("/{report_id}", response_model=AdminReportDetailResponse)
async def get_report_admin(
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminReportDetailResponse:
    _ = current_user
    return await AdminReportService(session).get_report_detail(report_id)
