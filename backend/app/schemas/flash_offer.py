"""Flash offer schema fields (TICKET-501)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class FlashOfferInput(BaseModel):
    is_flash: bool = False
    flash_ends_at: datetime | None = None


class FlashOfferPublicFields(BaseModel):
    is_flash: bool = False
    flash_ends_at: datetime | None = None
    remaining_hours: int | None = None
    remaining_minutes: int | None = None


class FlashOfferManagementFields(BaseModel):
    is_flash: bool = False
    flash_ends_at: datetime | None = None
    flash_active: bool = False
    remaining_hours: int | None = None
    remaining_minutes: int | None = None
    notification_sent_at: datetime | None = Field(
        default=None,
        description="Réservé notifications futures — non utilisé MVP.",
    )
