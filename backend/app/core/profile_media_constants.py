"""Profile avatar/banner upload limits (PILOT-FIX-02)."""

from __future__ import annotations

from enum import StrEnum

PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024
PROFILE_BANNER_MAX_BYTES = 5 * 1024 * 1024


class ProfileMediaKind(StrEnum):
    AVATAR = "avatar"
    BANNER = "banner"
