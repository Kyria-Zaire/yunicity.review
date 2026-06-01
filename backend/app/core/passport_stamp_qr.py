"""Partner Passport stamp QR token helpers — JWT-only MVP (WEB-PARTNERS-04A).

Separate from passport_qr.py which handles user-facing Passport QR tokens.
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import Settings, get_settings
from app.core.errors import AppError

STAMP_QR_TOKEN_TYPE = "passport_stamp"
STAMP_QR_DEFAULT_EXPIRES_MINUTES = 1440  # 24h
STAMP_QR_MAX_EXPIRES_MINUTES = 1440


def generate_stamp_qr_token(
    *,
    organization_id: str,
    partner_profile_id: str,
    partner_offer_id: str | None = None,
    expires_in_minutes: int = STAMP_QR_DEFAULT_EXPIRES_MINUTES,
    settings: Settings | None = None,
) -> tuple[str, datetime]:
    """Return (signed_jwt, expires_at). Nonce is embedded for log traceability only."""
    settings = settings or get_settings()
    now = datetime.now(UTC)
    minutes = min(max(expires_in_minutes, 1), STAMP_QR_MAX_EXPIRES_MINUTES)
    expires_at = now + timedelta(minutes=minutes)
    payload: dict[str, Any] = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": organization_id,
        "partner_profile_id": partner_profile_id,
        "nonce": secrets.token_urlsafe(16),
        "iat": now,
        "exp": expires_at,
    }
    if partner_offer_id is not None:
        payload["partner_offer_id"] = partner_offer_id
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_stamp_qr_token(
    token: str,
    *,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Decode and validate a partner stamp QR token. Raises AppError on failure."""
    settings = settings or get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as exc:
        raise AppError(
            status_code=410,
            code="STAMP_TOKEN_EXPIRED",
            detail="Ce QR a expiré.",
        ) from exc
    except jwt.PyJWTError as exc:
        raise AppError(
            status_code=400,
            code="STAMP_TOKEN_INVALID",
            detail="Ce QR n'est pas valide.",
        ) from exc
    if payload.get("typ") != STAMP_QR_TOKEN_TYPE:
        raise AppError(
            status_code=400,
            code="STAMP_TOKEN_INVALID",
            detail="Ce QR n'est pas valide.",
        )
    for required in ("organization_id", "partner_profile_id", "nonce"):
        if not payload.get(required):
            raise AppError(
                status_code=400,
                code="STAMP_TOKEN_INVALID",
                detail="Ce QR n'est pas valide.",
            )
    return payload
