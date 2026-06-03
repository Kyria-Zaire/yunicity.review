"""Admin partner creator content moderation schemas (WEB-PARTNERS-06C / ADMIN-CREATOR-01)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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
    "PartnerCreatorContentRejectRequest",
    "PartnerCreatorContentAuthorSummary",
    "PartnerCreatorContentAdminResponse",
    "PartnerCreatorContentAdminListResponse",
]


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
