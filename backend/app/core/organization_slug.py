"""Organization slug normalization and validation — no API in TICKET-203."""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Awaitable, Callable

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


def build_slug_base(*, name: str, city: str) -> str:
    name_part = slugify_organization_name(name)
    city_part = slugify_organization_name(city)
    if name_part and city_part:
        return f"{name_part}-{city_part}"[:ORGANIZATION_SLUG_MAX_LENGTH]
    candidate = name_part or city_part
    return candidate[:ORGANIZATION_SLUG_MAX_LENGTH] if candidate else "org"


async def pick_available_organization_slug(
    check_taken: Callable[[str], Awaitable[bool]],
    *,
    name: str,
    city: str,
) -> str:
    base = build_slug_base(name=name, city=city)
    if not is_valid_organization_slug_format(base):
        base = "org"

    candidate = base
    for suffix in range(2, 100):
        if not await check_taken(candidate):
            return candidate
        candidate = disambiguate_slug(base, suffix)
    raise RuntimeError("Unable to allocate a unique organization slug")
