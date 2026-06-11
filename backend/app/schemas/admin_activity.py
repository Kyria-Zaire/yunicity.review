"""Admin activity center schemas (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.core.admin_activity_constants import (
    ACTIVITY_FEED_LIMIT_DEFAULT,
    ACTIVITY_FEED_LIMIT_MAX,
    AdminActivityAlertSeverity,
    AdminActivityFeedCategory,
    AdminActivityFeedSeverity,
    AdminActivityHealthStatus,
)

AdminActivityCheckStatus = Literal["ok", "error", "unknown"]


class AdminActivityHealth(BaseModel):
    status: AdminActivityHealthStatus
    database: AdminActivityCheckStatus
    redis: AdminActivityCheckStatus


class AdminActivityAttentionSummary(BaseModel):
    critical: int = Field(ge=0)
    warning: int = Field(ge=0)
    total: int = Field(ge=0)
    healthy: bool


class AdminActivityAlert(BaseModel):
    id: str
    label: str
    description: str
    count: int = Field(ge=0)
    severity: AdminActivityAlertSeverity
    href: str
    category: Literal["moderation", "partners", "system"]


class AdminActivitySectionSummary(BaseModel):
    label: str
    count: int = Field(ge=0)
    severity: AdminActivityAlertSeverity


class AdminActivitySections(BaseModel):
    moderation: AdminActivitySectionSummary
    partners: AdminActivitySectionSummary
    system: AdminActivitySectionSummary


class AdminActivitySummaryResponse(BaseModel):
    generated_at: datetime
    read_only: bool = True
    health: AdminActivityHealth
    attention: AdminActivityAttentionSummary
    alerts: list[AdminActivityAlert]
    sections: AdminActivitySections


class AdminActivityFeedItem(BaseModel):
    id: str
    category: AdminActivityFeedCategory
    action: str
    title: str
    description: str
    actor_label: str
    target_label: str
    target_id: str
    href: str
    severity: AdminActivityFeedSeverity
    created_at: datetime


class AdminActivityFeedResponse(BaseModel):
    generated_at: datetime
    items: list[AdminActivityFeedItem]
    next_cursor: str | None = None


class AdminActivityFeedParams(BaseModel):
    limit: int = Field(default=ACTIVITY_FEED_LIMIT_DEFAULT, ge=1, le=ACTIVITY_FEED_LIMIT_MAX)
    cursor: str | None = None
    category: str = "all"
