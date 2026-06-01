"""Partner creator content management schemas (WEB-PARTNERS-06A)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.partner_creator_content_constants import (
    PARTNER_CREATOR_CONTENT_BODY_MAX_LENGTH,
    PARTNER_CREATOR_CONTENT_MEDIA_URL_MAX_LENGTH,
    PARTNER_CREATOR_CONTENT_STATUSES,
    PARTNER_CREATOR_CONTENT_TITLE_MAX_LENGTH,
    PartnerCreatorContentStatus,
)

PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT = 50
PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX = 100


class PartnerCreatorContentCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    organization_id: UUID
    title: str = Field(min_length=1, max_length=PARTNER_CREATOR_CONTENT_TITLE_MAX_LENGTH)
    body: str | None = Field(default=None, max_length=PARTNER_CREATOR_CONTENT_BODY_MAX_LENGTH)
    media_url: str | None = Field(
        default=None,
        max_length=PARTNER_CREATOR_CONTENT_MEDIA_URL_MAX_LENGTH,
    )


class PartnerCreatorContentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=PARTNER_CREATOR_CONTENT_TITLE_MAX_LENGTH,
    )
    body: str | None = Field(default=None, max_length=PARTNER_CREATOR_CONTENT_BODY_MAX_LENGTH)
    media_url: str | None = Field(
        default=None,
        max_length=PARTNER_CREATOR_CONTENT_MEDIA_URL_MAX_LENGTH,
    )


class PartnerCreatorContentOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    city: str


class PartnerCreatorContentManagementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    organization: PartnerCreatorContentOrganizationSummary
    title: str
    body: str | None
    media_url: str | None
    status: PartnerCreatorContentStatus
    is_active: bool
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime


class PartnerCreatorContentManagementListResponse(BaseModel):
    items: list[PartnerCreatorContentManagementResponse]
    total: int
    page: int
    page_size: int


def parse_creator_content_status_filter(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in PARTNER_CREATOR_CONTENT_STATUSES:
        raise ValueError("Statut de contenu invalide.")
    return normalized
