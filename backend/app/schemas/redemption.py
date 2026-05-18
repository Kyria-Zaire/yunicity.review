"""Offer redemption API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.passport_constants import OfferRedemptionStatus


class RedemptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    passport_id: UUID
    partner_offer_id: UUID
    status: OfferRedemptionStatus = Field(
        description="MVP : completed = utilisé (équivalent redeemed)."
    )
    redeemed_at: datetime | None
    created_at: datetime
