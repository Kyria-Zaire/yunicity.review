"""Partner scan & redemption schemas (TICKET-306)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.passport_constants import PartnerOfferType, PassportTierCode


class PassportQrResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    qr_payload: str = Field(description="Valeur à encoder dans le QR (opaque MVP).")
    passport_number: str
    expires_at: datetime | None = Field(
        default=None,
        description="MVP : null — rotation QR prévue V2.",
    )


class ScanResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    qr_secret: str = Field(min_length=8, max_length=256)


class ScanRedeemableOffer(BaseModel):
    id: UUID
    title: str
    offer_type: PartnerOfferType
    organization_id: UUID
    organization_name: str
    already_redeemed: bool


class ScanPassportPreview(BaseModel):
    passport_id: UUID
    passport_number: str
    city: str
    tier_code: PassportTierCode
    display_label: str


class ScanResolveResponse(BaseModel):
    passport: ScanPassportPreview
    offers: list[ScanRedeemableOffer]


class ScanRedeemRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    offer_id: UUID
    qr_secret: str = Field(min_length=8, max_length=256)


class ScanRedeemResponse(BaseModel):
    success: bool = True
    redemption_id: UUID
    offer_id: UUID
    offer_title: str
    offer_type: PartnerOfferType
    message: str
    stamp_added: bool = False
