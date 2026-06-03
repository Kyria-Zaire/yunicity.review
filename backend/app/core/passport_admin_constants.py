"""Admin passport action audit constants (ADMIN-03B)."""

from __future__ import annotations

from enum import StrEnum

PASSPORT_ADMIN_ACTIONS: frozenset[str] = frozenset({"suspend", "reactivate"})

ADMIN_PASSPORT_REASON_MIN_LENGTH = 3
ADMIN_PASSPORT_REASON_MAX_LENGTH = 1000


class PassportAdminAction(StrEnum):
    SUSPEND = "suspend"
    REACTIVATE = "reactivate"
