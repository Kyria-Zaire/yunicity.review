"""Pure query helpers for admin partner offer catalogue (OFFERS-V2-HARDENING)."""

from __future__ import annotations

from datetime import datetime

from app.core.passport_constants import PartnerOfferStatus


def normalize_admin_offer_title_query(raw: str | None) -> str | None:
    """Return a trimmed title query or None when empty."""
    if raw is None:
        return None
    trimmed = raw.strip()
    return trimmed or None


def published_offer_counts_as_expired_or_inactive(
    *,
    offer_status: str,
    is_active: bool,
    valid_from: datetime | None,
    valid_until: datetime | None,
    now: datetime,
) -> bool:
    """True when a published offer is inactive or outside its validity window."""
    if offer_status != PartnerOfferStatus.PUBLISHED.value:
        return False
    if not is_active:
        return True
    if valid_until is not None and valid_until < now:
        return True
    return valid_from is not None and valid_from > now
