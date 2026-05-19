"""Passport QR payload helpers — MVP static token (TICKET-306)."""

from __future__ import annotations

QR_PAYLOAD_PREFIX = "YNCP1:"


def build_qr_payload(qr_token: str) -> str:
    return f"{QR_PAYLOAD_PREFIX}{qr_token}"


def normalize_qr_secret(raw: str) -> str:
    """Extract opaque token from scanned value or manual paste."""
    value = raw.strip()
    if value.upper().startswith(QR_PAYLOAD_PREFIX.upper()):
        return value[len(QR_PAYLOAD_PREFIX) :].strip()
    return value
