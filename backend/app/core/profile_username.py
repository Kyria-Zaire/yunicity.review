"""Username validation and generation — immutable in MVP."""

from __future__ import annotations

import re
import uuid
from collections.abc import Awaitable, Callable

USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,30}$")

RESERVED_USERNAMES: frozenset[str] = frozenset(
    {
        "admin",
        "support",
        "yunicity",
        "api",
        "login",
        "register",
        "root",
        "system",
        "settings",
        "help",
        "moderator",
        "mod",
        "staff",
        "security",
        "billing",
        "account",
        "profile",
        "organizations",
        "org",
        "www",
        "null",
        "undefined",
        "me",
        "auth",
    }
)


def normalize_username(value: str) -> str:
    return value.strip().lower()


def is_reserved_username(username: str) -> bool:
    return normalize_username(username) in RESERVED_USERNAMES


def is_valid_username_format(username: str) -> bool:
    normalized = normalize_username(username)
    if not USERNAME_PATTERN.fullmatch(normalized):
        return False
    return not is_reserved_username(normalized)


def build_username_base(*, full_name: str, email: str) -> str:
    """Derive a candidate base from display name or email local-part."""
    from_name = re.sub(r"[^a-z0-9]+", "_", full_name.strip().lower())
    from_name = re.sub(r"_+", "_", from_name).strip("_")
    if len(from_name) >= 3:
        return from_name[:30]

    local = email.split("@", 1)[0].lower()
    from_email = re.sub(r"[^a-z0-9]+", "_", local)
    from_email = re.sub(r"_+", "_", from_email).strip("_")
    if len(from_email) >= 3:
        return from_email[:30]

    return ""


def fallback_username(user_id: uuid.UUID) -> str:
    suffix = str(user_id).replace("-", "")[:8]
    return f"user_{suffix}"


def candidate_usernames(*, full_name: str, email: str, user_id: uuid.UUID) -> list[str]:
    """Ordered unique candidates for username assignment."""
    seen: set[str] = set()
    ordered: list[str] = []

    def add(candidate: str) -> None:
        normalized = normalize_username(candidate)
        if not normalized or normalized in seen:
            return
        if not USERNAME_PATTERN.fullmatch(normalized):
            return
        if is_reserved_username(normalized):
            return
        seen.add(normalized)
        ordered.append(normalized)

    base = build_username_base(full_name=full_name, email=email)
    if base:
        add(base)
        for i in range(2, 100):
            suffix = f"_{i}"
            trimmed = base[: 30 - len(suffix)]
            add(f"{trimmed}{suffix}")

    add(fallback_username(user_id))
    for i in range(2, 100):
        fb = fallback_username(user_id)
        add(f"{fb}_{i}")

    return ordered


async def pick_available_username(
    check_taken: Callable[[str], Awaitable[bool]],
    *,
    full_name: str,
    email: str,
    user_id: uuid.UUID,
) -> str:
    for candidate in candidate_usernames(
        full_name=full_name, email=email, user_id=user_id
    ):
        if not await check_taken(candidate):
            return candidate
    raise RuntimeError("Unable to allocate a unique username")


def pick_available_username_sync(
    taken: set[str],
    *,
    full_name: str,
    email: str,
    user_id: uuid.UUID,
) -> str:
    for candidate in candidate_usernames(
        full_name=full_name, email=email, user_id=user_id
    ):
        if candidate not in taken:
            taken.add(candidate)
            return candidate
    raise RuntimeError("Unable to allocate a unique username")
