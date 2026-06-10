"""Admin partner creator content moderation schemas (WEB-PARTNERS-06C / ADMIN-CREATOR-01)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.creator_content_admin_constants import (
    CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
    CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
)
from app.core.partner_creator_content_constants import (
    PARTNER_CREATOR_CONTENT_REJECTION_REASON_MAX_LENGTH,
)
from app.schemas.partner_creator_content_management import (
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    PartnerCreatorContentManagementResponse,
)

__all__ = [
    "PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT",
    "PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX",
    "CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT",
    "CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX",
    "PartnerCreatorContentRejectRequest",
    "PartnerCreatorContentAuthorSummary",
    "PartnerCreatorContentAdminResponse",
    "PartnerCreatorContentAdminListResponse",
    "PartnerCreatorContentAdminSummaryResponse",
    "AdminPartnerCreatorContentActionKind",
    "AdminPartnerCreatorContentActorSummary",
    "AdminPartnerCreatorContentActionItem",
    "AdminPartnerCreatorContentActionListResponse",
]


class PartnerCreatorContentAdminSummaryResponse(BaseModel):
    """Aggregated editorial metrics for admin command center (CREATOR-CONTENT-V2-01)."""

    model_config = ConfigDict(extra="forbid")

    city: str
    generated_at: datetime
    total: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    published: int = Field(ge=0)
    rejected: int = Field(ge=0)
    archived: int = Field(ge=0)
    draft: int = Field(ge=0)
    contributing_partners: int = Field(ge=0)


class PartnerCreatorContentRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(
        min_length=1,
        max_length=PARTNER_CREATOR_CONTENT_REJECTION_REASON_MAX_LENGTH,
    )


class PartnerCreatorContentAuthorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None
    display_name: str | None


class PartnerCreatorContentAdminResponse(PartnerCreatorContentManagementResponse):
    author: PartnerCreatorContentAuthorSummary | None = None
    submitted_at: datetime | None = None


class PartnerCreatorContentAdminListResponse(BaseModel):
    items: list[PartnerCreatorContentAdminResponse]
    total: int
    page: int
    page_size: int


AdminPartnerCreatorContentActionKind = Literal["approve", "reject", "archive"]


class AdminPartnerCreatorContentActorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str | None = None


class AdminPartnerCreatorContentActionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    action: AdminPartnerCreatorContentActionKind
    previous_status: str | None = None
    new_status: str | None = None
    reason: str | None = None
    actor_user: AdminPartnerCreatorContentActorSummary
    created_at: datetime


class AdminPartnerCreatorContentActionListResponse(BaseModel):
    items: list[AdminPartnerCreatorContentActionItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX)
