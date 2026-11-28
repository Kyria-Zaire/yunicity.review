"""Participant presence session response (PASSPORT-PRESENCE-01B, PRD § 6)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PresenceSessionResponse(BaseModel):
    """Returned once, at issuance. Neither value can be read again afterwards."""

    model_config = ConfigDict(frozen=True)

    # ``repr=False`` keeps clear credentials out of reprs (logs, tracebacks, reports).
    qr_payload: str = Field(repr=False)
    manual_code: str = Field(repr=False)
    expires_at: datetime
    refresh_after_seconds: int
