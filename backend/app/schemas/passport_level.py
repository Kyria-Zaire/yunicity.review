"""Passport level / progression schemas (TICKET-502)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.passport_constants import PassportTierCode


class PassportProgressionHint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    next_tier_code: PassportTierCode | None
    next_tier_label: str | None
    hint: str | None
    reputation_score: int
    points_to_next: int | None


class PassportTierPromotionEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    from_tier_code: str
    to_tier_code: str
    reason: str
    created_at: datetime
