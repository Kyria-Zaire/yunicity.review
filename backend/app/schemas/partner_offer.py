"""Partner offer API schemas — citizen Passport view (TICKET-303)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.passport_constants import PartnerOfferType


class PartnerOfferOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    city: str
    logo_url: str | None


class PartnerOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    title: str
    description: str | None
    offer_type: PartnerOfferType
    tier_code_required: str | None
    valid_from: datetime | None
    valid_until: datetime | None
    organization: PartnerOfferOrganizationSummary


class PartnerOfferListResponse(BaseModel):
    items: list[PartnerOfferResponse]
    total: int
