"""Organization slug normalization and validation — no API in TICKET-203."""

from __future__ import annotations

import re
import unicodedata

from app.core.organization_constants import (
    ORGANIZATION_SLUG_MAX_LENGTH,
    ORGANIZATION_SLUG_MIN_LENGTH,
)

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

RESERVED_ORGANIZATION_SLUGS: frozenset[str] = frozenset(
    {
        "admin",
        "api",
        "login",
        "register",
        "support",
        "yunicity",
        "system",
        "settings",
        "profile",
        "organizations",
        "o",
        "www",
        "help",
        "moderator",
        "auth",
        "me",
    }
)


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def slugify_organization_name(name: str) -> str:
    """Build a slug candidate from a display name."""
    ascii_name = strip_accents(name.strip().lower())
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:ORGANIZATION_SLUG_MAX_LENGTH]


def normalize_organization_slug(value: str) -> str:
    return value.strip().lower()


def is_reserved_organization_slug(slug: str) -> bool:
    return normalize_organization_slug(slug) in RESERVED_ORGANIZATION_SLUGS


def is_valid_organization_slug_format(slug: str) -> bool:
    normalized = normalize_organization_slug(slug)
    if len(normalized) < ORGANIZATION_SLUG_MIN_LENGTH:
        return False
    if len(normalized) > ORGANIZATION_SLUG_MAX_LENGTH:
        return False
    if not SLUG_PATTERN.fullmatch(normalized):
        return False
    return not is_reserved_organization_slug(normalized)


def disambiguate_slug(base: str, suffix: int) -> str:
    suffix_text = f"-{suffix}"
    trimmed = base[: ORGANIZATION_SLUG_MAX_LENGTH - len(suffix_text)].rstrip("-")
    if not trimmed:
        trimmed = "org"
    return f"{trimmed}{suffix_text}"
