"""Presence validation domain constants (PASSPORT-PRESENCE-01).

Statuses and limits are the single source of truth for models, migration and services.
"""

from __future__ import annotations

from enum import StrEnum


class PresenceCampaignStatus(StrEnum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class PresenceRegistrationStatus(StrEnum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class PresenceAssignmentStatus(StrEnum):
    ACTIVE = "active"
    REVOKED = "revoked"


class PresenceSource(StrEnum):
    SCAN = "scan"
    MANUAL = "manual"


class PresenceOperationResult(StrEnum):
    """Final outcomes stored in base. ``uncertain`` is a client-only state (never stored)."""

    POSTED = "posted"
    ALREADY_PROCESSED = "already_processed"
    REJECTED = "rejected"


class PresenceAdminActionType(StrEnum):
    CAMPAIGN_CREATED = "campaign_created"
    CAMPAIGN_STATUS_CHANGED = "campaign_status_changed"
    REGISTRATION_SET = "registration_set"
    AGENT_ASSIGNMENT_SET = "agent_assignment_set"
    USER_TEST_FLAG_SET = "user_test_flag_set"


#: Allowed campaign transitions (ADR § 4). Anything else is refused.
PRESENCE_CAMPAIGN_TRANSITIONS: dict[str, frozenset[str]] = {
    PresenceCampaignStatus.DRAFT.value: frozenset(
        {PresenceCampaignStatus.OPEN.value, PresenceCampaignStatus.ARCHIVED.value}
    ),
    PresenceCampaignStatus.OPEN.value: frozenset({PresenceCampaignStatus.CLOSED.value}),
    PresenceCampaignStatus.CLOSED.value: frozenset({PresenceCampaignStatus.ARCHIVED.value}),
    PresenceCampaignStatus.ARCHIVED.value: frozenset(),
}

PRESENCE_CAMPAIGN_STATUSES: frozenset[str] = frozenset(s.value for s in PresenceCampaignStatus)
PRESENCE_REGISTRATION_STATUSES: frozenset[str] = frozenset(
    s.value for s in PresenceRegistrationStatus
)
PRESENCE_ASSIGNMENT_STATUSES: frozenset[str] = frozenset(s.value for s in PresenceAssignmentStatus)
PRESENCE_SOURCES: frozenset[str] = frozenset(s.value for s in PresenceSource)
PRESENCE_OPERATION_RESULTS: frozenset[str] = frozenset(s.value for s in PresenceOperationResult)

#: Staff permissions allowed to administer presence (B4), same guard as other admin ops.
PRESENCE_STAFF_PERMISSIONS: tuple[str, ...] = ("moderation.manage", "system.admin")

#: Minimum length of PRESENCE_TOKEN_PEPPER when the feature is enabled (ADR § 6).
PRESENCE_TOKEN_PEPPER_MIN_LENGTH = 32

PRESENCE_ADMIN_LIST_PAGE_SIZE_DEFAULT = 20
PRESENCE_ADMIN_LIST_PAGE_SIZE_MAX = 50
