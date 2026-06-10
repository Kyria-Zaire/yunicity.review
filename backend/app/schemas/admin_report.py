"""Admin citizen reports read schemas (ADMIN-07B)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.report_admin_constants import (
    REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    REPORT_ADMIN_LIST_PAGE_SIZE_MAX,
    REPORT_RESOLUTION_NOTE_MAX_LENGTH,
)

AdminReportStatus = Literal["pending", "reviewed", "dismissed", "action_taken"]
AdminReportReason = Literal["spam", "inappropriate", "other"]
AdminReportTargetType = Literal["post", "offer", "event", "partner_creator"]


class AdminReportReporterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str | None = None


class AdminReportListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reason: AdminReportReason
    status: AdminReportStatus
    reporter: AdminReportReporterSummary
    target_type: AdminReportTargetType
    target_id: UUID
    created_at: datetime


class AdminReportStatusSummary(BaseModel):
    total: int = Field(ge=0)
    pending: int = Field(ge=0)
    resolved: int = Field(ge=0)
    dismissed: int = Field(ge=0)


class AdminReportAdminSummaryResponse(BaseModel):
    """Aggregated Trust & Safety metrics (MODERATION-V2-01)."""

    model_config = ConfigDict(extra="forbid")

    generated_at: datetime
    total: int = Field(ge=0)
    pending: int = Field(ge=0)
    resolved: int = Field(ge=0)
    dismissed: int = Field(ge=0)
    dominant_reason: AdminReportReason | None = None


class AdminReportListResponse(BaseModel):
    items: list[AdminReportListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=REPORT_ADMIN_LIST_PAGE_SIZE_MAX)
    summary: AdminReportStatusSummary


class AdminReportResolverSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str | None = None


class AdminReportTargetPostSummary(BaseModel):
    id: UUID
    type: AdminReportTargetType
    title: str | None = None
    body_excerpt: str | None = None
    is_active: bool
    author_type: str
    author_id: UUID
    city: str | None = None


class AdminReportDetailResponse(BaseModel):
    id: UUID
    reason: AdminReportReason
    status: AdminReportStatus
    created_at: datetime
    resolved_at: datetime | None = None
    resolution_note: str | None = None
    reporter: AdminReportReporterSummary
    resolver: AdminReportResolverSummary | None = None
    target_type: AdminReportTargetType
    target_id: UUID
    target_post: AdminReportTargetPostSummary


class AdminReportDismissRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str | None = Field(default=None, max_length=REPORT_RESOLUTION_NOTE_MAX_LENGTH)


class AdminReportResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str | None = Field(default=None, max_length=REPORT_RESOLUTION_NOTE_MAX_LENGTH)
    hide_post: bool = False


class AdminReportActionActorSummary(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None


class AdminReportActionListItem(BaseModel):
    action: str
    previous_status: str | None = None
    new_status: str | None = None
    reason: str | None = None
    actor_user: AdminReportActionActorSummary | None = None
    created_at: datetime


class AdminReportActionListResponse(BaseModel):
    items: list[AdminReportActionListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
