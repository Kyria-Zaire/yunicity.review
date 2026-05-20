"""Passport API schemas."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.passport_constants import PassportStampSource, PassportStatus, PassportTierCode
from app.schemas.passport_level import PassportProgressionHint


class PassportActivateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str | None = Field(default=None, max_length=128)


class PassportTierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: PassportTierCode
    name: str
    description: str | None
    display_order: int
    flags: dict[str, Any]


class PassportStatsResponse(BaseModel):
    stamps_count: int
    redemptions_count: int
    last_stamp_at: datetime | None


class PassportMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    city: str
    passport_number: str
    qr_token: str
    status: PassportStatus
    tier: PassportTierResponse
    stats: PassportStatsResponse
    reputation_score: int = 0
    progression: PassportProgressionHint | None = None
    tier_unlocked_at: datetime | None = None
    onboarding_completed: bool
    onboarding_step: str | None
    activated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PassportStampOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    city: str
    logo_url: str | None


class PassportStampKind(StrEnum):
    VISIT = "visit"
    MEMORY = "memory"


class PassportStampResponse(BaseModel):
    """Unified timeline item — partner visit or territorial memory (TICKET-504)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    kind: PassportStampKind = PassportStampKind.VISIT
    stamped_at: datetime
    passport_id: UUID | None = None
    organization_id: UUID | None = None
    stamp_source: PassportStampSource | None = None
    organization: PassportStampOrganizationSummary | None = None
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    slug: str | None = None
    city: str | None = None
    human_line: str | None = None


class PassportStampListResponse(BaseModel):
    items: list[PassportStampResponse]
    total: int


class PassportTierListResponse(BaseModel):
    items: list[PassportTierResponse]
