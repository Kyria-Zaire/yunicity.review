"""Signed partners public API schemas (WEB-PARTNERS-01)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.partner_constants import PartnershipType, PartnerStatus


class PartnerPublicItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    slug: str
    category: str | None
    city: str
    description: str | None
    logo_url: str | None
    cover_image_url: str | None
    is_featured: bool
    partner_status: PartnerStatus
    partnership_type: PartnershipType
    public_partner_label: str | None = None
    address: str | None = None
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    website_url: str | None = None
    phone: str | None = None
    instagram_url: str | None = None
    is_verified: bool
    created_at: datetime


class PartnerPublicDetail(PartnerPublicItem):
    pass


class PartnerListResponse(BaseModel):
    city: str
    items: list[PartnerPublicItem]
    count: int
    total: int
    offset: int
    limit: int = Field(ge=1)
