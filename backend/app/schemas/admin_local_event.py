"""Admin local event schemas (ADMIN-05C / 05D-A)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.event_admin_constants import (
    EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
)

EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT = 20

__all__ = [
    "EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT",
    "EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX",
    "AdminLocalEventActionItem",
    "AdminLocalEventActionListResponse",
    "AdminLocalEventActorSummary",
    "AdminLocalEventCancelRequest",
    "AdminLocalEventDetailResponse",
    "AdminLocalEventOrganizationDetail",
    "LocalEventAdminSummaryResponse",
]


class LocalEventAdminSummaryResponse(BaseModel):
    """Aggregated agenda metrics for admin command center (EVENTS-V2-01)."""

    model_config = ConfigDict(extra="forbid")

    city: str
    generated_at: datetime
    total: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    published: int = Field(ge=0)
    upcoming_published: int = Field(ge=0)
    cancelled_or_archived: int = Field(ge=0)
    rejected: int = Field(ge=0)


class AdminLocalEventOrganizationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    verification_status: str
    visibility: str


class AdminLocalEventDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    city: str
    location_name: str
    address: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    timezone: str
    visibility: str
    moderation_status: str
    is_cancelled: bool
    cancelled_at: datetime | None = None
    cancelled_by_user_id: uuid.UUID | None = None
    interest_count: int = Field(ge=0)
    rejection_reason: str | None = None
    organization: AdminLocalEventOrganizationDetail | None = None
    created_at: datetime
    updated_at: datetime


class AdminLocalEventCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=3, max_length=1000)


AdminLocalEventActionKind = Literal["approve", "reject", "cancel"]


class AdminLocalEventActorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str | None = None


class AdminLocalEventActionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    action: AdminLocalEventActionKind
    previous_status: str | None = None
    new_status: str | None = None
    reason: str | None = None
    actor_user: AdminLocalEventActorSummary
    created_at: datetime


class AdminLocalEventActionListResponse(BaseModel):
    items: list[AdminLocalEventActionItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
