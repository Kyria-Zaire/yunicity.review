"""Passport number and QR placeholder generation (MVP — no live QR)."""

from __future__ import annotations

import re
import secrets

from app.core.passport_constants import PASSPORT_NUMBER_MAX_LENGTH, PASSPORT_QR_TOKEN_MAX_LENGTH

_CITY_SLUG_RE = re.compile(r"[^A-Z0-9]+")


def _city_slug(city: str) -> str:
    normalized = city.strip().upper()
    slug = _CITY_SLUG_RE.sub("-", normalized).strip("-")
    return slug[:12] or "CITY"


def generate_passport_number(city: str) -> str:
    """Human-readable identifier, e.g. YUN-REIMS-A1B2."""
    suffix = secrets.token_hex(2).upper()
    number = f"YUN-{_city_slug(city)}-{suffix}"
    return number[:PASSPORT_NUMBER_MAX_LENGTH]


def generate_qr_token_placeholder() -> str:
    """Opaque placeholder until live QR rotation (future ticket)."""
    token = f"qr_ph_{secrets.token_urlsafe(24)}"
    return token[:PASSPORT_QR_TOKEN_MAX_LENGTH]
