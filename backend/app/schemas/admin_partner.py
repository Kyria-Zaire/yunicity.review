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
    can_update_settings: bool = False


class AdminPartnerCreateProfileRequest(BaseModel):
    partnership_type: PartnershipType = PartnershipType.LOCAL_BUSINESS
    public_partner_label: str | None = Field(default=None, max_length=160)
    reason: str | None = Field(default=None, max_length=1000)


class AdminPartnerActivateRequest(BaseModel):
    visibility: OrganizationVisibility | None = None
    reason: str | None = Field(default=None, max_length=1000)


class AdminPartnerPauseRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


class AdminPartnerUpgradePremiumRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


class AdminPartnerPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    visibility: OrganizationVisibility | None = None
    is_featured: bool | None = None
    public_partner_label: str | None = Field(default=None, max_length=160)


class AdminPartnerDetailResponse(BaseModel):
    organization: AdminPartnerOrganizationDetail
    partner_profile: AdminPartnerProfileDetail | None
    counters: AdminPartnerOperationalCounters
    links: AdminPartnerDetailLinks
    capabilities: AdminPartnerDetailCapabilities
