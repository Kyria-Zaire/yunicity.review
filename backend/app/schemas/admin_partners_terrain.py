"""Admin partners terrain command center schemas (ADMIN-PARTNERS-UX-01)."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.organization_constants import OrganizationType, VerificationStatus
from app.core.partner_constants import PartnershipType, PartnerStatus

TERRAIN_LIST_PAGE_SIZE_DEFAULT = 20
TERRAIN_LIST_PAGE_SIZE_MAX = 100


class AdminPartnersCategoryBreakdownItem(BaseModel):
    key: str
    count: int = Field(ge=0)


class AdminPartnersTopActiveItem(BaseModel):
    organization_id: UUID
    name: str
    logo_url: str | None = None
    interactions_count: int = Field(ge=0)


class AdminPartnersPendingRequestItem(BaseModel):
    organization_id: UUID
    name: str
    organization_type: OrganizationType
    requested_at: datetime


class AdminPartnersMapPin(BaseModel):
    organization_id: UUID
    name: str
    latitude: float
    longitude: float


class AdminPartnersEvolutionPoint(BaseModel):
    date: date
    cumulative_total: int = Field(ge=0)
    new_count: int = Field(ge=0)


class AdminPartnersTerrainListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organization_id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    organization_type: OrganizationType
    partnership_type: PartnershipType | None = None
    category: str | None = None
    neighborhood_name: str | None = None
    address: str | None = None
    city: str
    verification_status: VerificationStatus
    partner_status: PartnerStatus | None = None
    stamps_count: int = Field(ge=0)
    updated_at: datetime


class AdminPartnersTerrainListResponse(BaseModel):
    items: list[AdminPartnersTerrainListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=TERRAIN_LIST_PAGE_SIZE_MAX)
