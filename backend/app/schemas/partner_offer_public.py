"""Public partner offer catalog schemas (WEB-PARTNERS-03 / 08B)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.partner_constants import PartnerStatus
from app.core.passport_constants import PartnerOfferType


class PartnerOfferPartnerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    city: str
    category: str | None
    logo_url: str | None
    cover_image_url: str | None
    is_verified: bool
    partner_status: PartnerStatus


class PartnerOfferPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str | None
    title: str
    description: str | None
    value_label: str | None
    offer_type: PartnerOfferType
    conditions: str | None
    valid_from: datetime | None
    valid_until: datetime | None
    is_featured: bool = False
    tier_code_required: str | None = None
    partner: PartnerOfferPartnerSummary


class PartnerOfferPublicListResponse(BaseModel):
    city: str
    items: list[PartnerOfferPublic]
    count: int
    total: int
    offset: int
    limit: int = Field(ge=1)
