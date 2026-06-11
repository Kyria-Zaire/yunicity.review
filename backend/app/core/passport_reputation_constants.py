"""Passport V2 reputation domain constants (PASSPORT-01A)."""

from __future__ import annotations

from enum import StrEnum

# MVP point weights — hooks in PASSPORT-01B will use these values.
STAMP_EARNED_POINTS = 5
EVENT_ATTENDED_POINTS = 10
CHALLENGE_COMPLETED_DEFAULT_POINTS = 50
BADGE_REWARD_DEFAULT_POINTS = 0


class PassportReputationEventType(StrEnum):
    STAMP_EARNED = "stamp_earned"
    EVENT_ATTENDED = "event_attended"
    CHALLENGE_COMPLETED = "challenge_completed"
    BADGE_REWARD = "badge_reward"
    MANUAL_ADJUSTMENT = "manual_adjustment"
    BACKFILL = "backfill"


class PassportReputationSourceType(StrEnum):
    PASSPORT_STAMP = "passport_stamp"
    LOCAL_EVENT = "local_event"
    CHALLENGE = "challenge"
    BADGE = "badge"
    ADMIN_ACTION = "admin_action"
    BACKFILL = "backfill"


PASSPORT_REPUTATION_EVENT_TYPES: frozenset[str] = frozenset(
    member.value for member in PassportReputationEventType
)
PASSPORT_REPUTATION_SOURCE_TYPES: frozenset[str] = frozenset(
    member.value for member in PassportReputationSourceType
)
