"""Admin partner detail read schemas (ADMIN-02D1)."""

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


class AdminPartnerOrganizationDetail(BaseModel):
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


class AdminPartnerProfileDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    partner_status: PartnerStatus
    partnership_type: PartnershipType
    is_featured: bool
    signed_at: datetime | None = None
    activated_at: datetime | None = None


class AdminPartnerOperationalCounters(BaseModel):
    offers_total: int = Field(ge=0)
    offers_pending: int = Field(ge=0)
    offers_published: int = Field(ge=0)
    creator_contents_total: int = Field(ge=0)
    creator_contents_pending: int = Field(ge=0)
    events_total: int = Field(ge=0)
    events_pending: int = Field(ge=0)
    stamps_total: int = Field(ge=0)
    redemptions_total: int = Field(ge=0)
    redemptions_completed: int = Field(ge=0)


class AdminPartnerDetailLinks(BaseModel):
    public_place_slug: str
    organization_id: str
    offers_admin: str
    creator_content_admin: str
    verification_queue: str


class AdminPartnerDetailCapabilities(BaseModel):
    can_activate: bool = False
    can_pause: bool = False
    can_upgrade_premium: bool = False
    can_create_profile: bool = False


class AdminPartnerDetailResponse(BaseModel):
    organization: AdminPartnerOrganizationDetail
    partner_profile: AdminPartnerProfileDetail | None
    counters: AdminPartnerOperationalCounters
    links: AdminPartnerDetailLinks
    capabilities: AdminPartnerDetailCapabilities
