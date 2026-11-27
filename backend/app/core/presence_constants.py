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

# --- Ephemeral participant session (ADR § 4 and § 6, CTO decisions D1-D4 of 01B) ---

#: Session lifetime, computed by PostgreSQL with ``clock_timestamp()`` (D4).
PRESENCE_SESSION_TTL_SECONDS = 60
#: Delay after which the client asks for a new session (the previous one stays valid).
PRESENCE_SESSION_REFRESH_AFTER_SECONDS = 30
#: Maximum live sessions per Passport, checked under the Passport row lock (D1).
PRESENCE_MAX_LIVE_SESSIONS_PER_PASSPORT = 3
#: Draws attempted when a digest collides with a stored one (probability ~ N / 2**40).
PRESENCE_SESSION_ISSUE_MAX_ATTEMPTS = 3

#: QR payload prefix. ``YNCP1`` (static Passport token) is a different, excluded scheme.
PRESENCE_QR_PREFIX = "YNCP2:"
#: Entropy of the QR token: ``secrets.token_urlsafe(32)`` -> 256 bits, 43 characters.
PRESENCE_QR_TOKEN_BYTES = 32
PRESENCE_QR_TOKEN_LENGTH = 43

#: Crockford Base32 alphabet (no I, L, O, U); 8 independent draws -> 40 bits.
PRESENCE_MANUAL_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
PRESENCE_MANUAL_CODE_LENGTH = 8
#: Inputs longer than this are rejected before any normalisation work.
PRESENCE_MANUAL_CODE_MAX_INPUT_LENGTH = 32
