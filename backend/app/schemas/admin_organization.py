"""Admin organization verification queue schemas (ADMIN-02B1)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY

ADMIN_ORGANIZATION_LIST_PAGE_SIZE_DEFAULT = 20
ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX = 100

DEFAULT_ADMIN_ORGANIZATIONS_CITY = DEFAULT_COCKPIT_CITY


class AdminOrganizationListItem(BaseModel):
    """Staff list row — no PII or internal review fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    type: OrganizationType
    city: str
    visibility: OrganizationVisibility
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: datetime
    partner_status: PartnerStatus | None = None
    partnership_type: PartnershipType | None = None


class AdminOrganizationListResponse(BaseModel):
    items: list[AdminOrganizationListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX)
