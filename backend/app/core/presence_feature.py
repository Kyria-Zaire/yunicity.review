"""Fail-closed feature flag for presence validation (PASSPORT-PRESENCE-01, B11)."""

from __future__ import annotations

from fastapi import HTTPException

from app.core.config import get_settings


def presence_validation_enabled() -> bool:
    return get_settings().presence_validation_enabled


def require_presence_validation_enabled() -> None:
    """Router-level dependency: runs before authentication, database access and body parsing.

    Raises the framework's own 404 so that a disabled route is indistinguishable from an
    unknown path (same status, same body); an ``AppError`` would leak a domain code.
    """
    if not presence_validation_enabled():
        raise HTTPException(status_code=404, detail="Not Found")
