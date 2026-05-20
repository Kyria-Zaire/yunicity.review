"""Search query normalization (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

import re

from app.core.errors import AppError
from app.core.search_constants import SEARCH_QUERY_MAX_LENGTH, SEARCH_QUERY_MIN_LENGTH

_MULTI_SPACE = re.compile(r"\s+")


def normalize_search_query(raw: str) -> str:
    """Trim, collapse spaces, validate length — safe for plainto_tsquery."""
    cleaned = _MULTI_SPACE.sub(" ", raw.strip())
    if not cleaned:
        raise AppError(
            status_code=400,
            code="QUERY_REQUIRED",
            detail="Saisissez au moins 2 caractères pour rechercher.",
        )
    if len(cleaned) < SEARCH_QUERY_MIN_LENGTH:
        raise AppError(
            status_code=400,
            code="QUERY_TOO_SHORT",
            detail=f"Minimum {SEARCH_QUERY_MIN_LENGTH} caractères.",
        )
    if len(cleaned) > SEARCH_QUERY_MAX_LENGTH:
        raise AppError(
            status_code=400,
            code="QUERY_TOO_LONG",
            detail=f"Maximum {SEARCH_QUERY_MAX_LENGTH} caractères.",
        )
    if not re.search(r"[\wÀ-ÿ]", cleaned, flags=re.UNICODE):
        raise AppError(
            status_code=400,
            code="QUERY_INVALID",
            detail="Requête invalide.",
        )
    return cleaned


def normalize_city(raw: str) -> str:
    return raw.strip()
