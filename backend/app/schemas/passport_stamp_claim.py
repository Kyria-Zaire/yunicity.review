"""Passport stamp QR claim API schemas (WEB-PARTNERS-04A)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StampQrGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partner_offer_id: UUID | None = None
    expires_in_minutes: int = Field(default=1440, ge=1, le=1440)


class StampQrGenerateResponse(BaseModel):
    qr_url: str
    expires_at: datetime


class StampClaimRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=16, max_length=2048)


class StampClaimOrganizationItem(BaseModel):
    id: UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None


class StampClaimItem(BaseModel):
    id: UUID
    organization_id: UUID
    organization: StampClaimOrganizationItem
    stamp_source: str
    stamped_at: datetime


class StampClaimPassportSummary(BaseModel):
    stamps_count: int
    tier_code: str


class StampClaimResponse(BaseModel):
    """Unified response for both 201 (created) and 200 (already_claimed)."""

    status: str  # "created" | "already_claimed"
    already_claimed: bool
    stamp: StampClaimItem
    passport: StampClaimPassportSummary
