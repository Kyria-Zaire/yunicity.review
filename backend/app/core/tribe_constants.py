"""Tribe domain constants (FEATURE-A / TICKET-A.2)."""

from __future__ import annotations

from enum import StrEnum

TRIBE_SLUG_MAX_LENGTH = 64
TRIBE_NAME_MAX_LENGTH = 120
TRIBE_DESCRIPTION_MAX_LENGTH = 4000
TRIBE_CATEGORY_MAX_LENGTH = 32
TRIBE_LIST_PAGE_SIZE_DEFAULT = 20
TRIBE_LIST_PAGE_SIZE_MAX = 50
TRIBE_POST_PAGE_SIZE_DEFAULT = 20
TRIBE_POST_PAGE_SIZE_MAX = 30

TRIBE_MEMBER_LIMIT_DEFAULT = 150
TRIBE_MAX_ACTIVE_PER_USER = 5
TRIBE_REJOIN_COOLDOWN_DAYS = 7
TRIBE_POST_COOLDOWN_SECONDS = 60
TRIBE_CHARTER_VERSION = 1
TRIBE_INVITATION_TTL_DAYS = 7

TRIBE_VISIBILITYS: frozenset[str] = frozenset({"public", "private_invite"})
TRIBE_MEMBER_ROLES: frozenset[str] = frozenset({"member", "moderator", "owner"})
TRIBE_CATEGORIES: frozenset[str] = frozenset(
    {
        "sport_local",
        "photography",
        "volunteering",
        "cafe_culture",
        "students",
        "music",
        "association",
        "other",
    }
)
TRIBE_PERSISTENCE_KINDS: frozenset[str] = frozenset({"persistent", "event_bound", "hybrid"})


class TribeVisibility(StrEnum):
    PUBLIC = "public"
    PRIVATE_INVITE = "private_invite"


class TribeMemberRole(StrEnum):
    MEMBER = "member"
    MODERATOR = "moderator"
    OWNER = "owner"


class TribeCategory(StrEnum):
    SPORT_LOCAL = "sport_local"
    PHOTOGRAPHY = "photography"
    VOLUNTEERING = "volunteering"
    CAFE_CULTURE = "cafe_culture"
    STUDENTS = "students"
    MUSIC = "music"
    ASSOCIATION = "association"
    OTHER = "other"


class TribePersistenceKind(StrEnum):
    PERSISTENT = "persistent"
    EVENT_BOUND = "event_bound"
    HYBRID = "hybrid"


class TribeModerationAction(StrEnum):
    EXCLUDE_MEMBER = "exclude_member"
    REMOVE_POST = "remove_post"
    ARCHIVE_TRIBE = "archive_tribe"
    SUSPEND_TRIBE = "suspend_tribe"
    CHANGE_ROLE = "change_role"
