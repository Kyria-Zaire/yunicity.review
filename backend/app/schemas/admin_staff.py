"""Admin staff management schemas (ADMIN-08B)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.staff_admin_constants import (
    STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    STAFF_ADMIN_LIST_PAGE_SIZE_MAX,
    STAFF_ADMIN_REASON_MAX_LENGTH,
)


class AdminStaffListItem(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    roles: list[str]
    permissions: list[str]
    created_at: datetime
    updated_at: datetime


class AdminStaffListResponse(BaseModel):
    items: list[AdminStaffListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=STAFF_ADMIN_LIST_PAGE_SIZE_MAX)


class AdminStaffAdminSummaryResponse(BaseModel):
    """Aggregated platform access metrics (STAFF-V10-01)."""

    model_config = ConfigDict(extra="forbid")

    generated_at: datetime
    total: int = Field(ge=0)
    active: int = Field(ge=0)
    suspended: int = Field(ge=0)
    super_admins: int = Field(ge=0)
    city_admins: int = Field(ge=0)
    moderators: int = Field(ge=0)
    dominant_role: str | None = None


class AdminStaffDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    city: str | None = None
    is_active: bool
    is_verified: bool
    roles: list[str]
    permissions: list[str]
    created_at: datetime
    updated_at: datetime


class AdminStaffAssignRoleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: str = Field(min_length=1, max_length=64)
    reason: str | None = Field(default=None, max_length=STAFF_ADMIN_REASON_MAX_LENGTH)


class AdminStaffReasonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str | None = Field(default=None, max_length=STAFF_ADMIN_REASON_MAX_LENGTH)


class AdminStaffActionActorSummary(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None


class AdminStaffActionListItem(BaseModel):
    action: str
    previous_roles: list[str] | None = None
    new_roles: list[str] | None = None
    reason: str | None = None
    actor_user: AdminStaffActionActorSummary | None = None
    created_at: datetime


class AdminStaffActionListResponse(BaseModel):
    items: list[AdminStaffActionListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
