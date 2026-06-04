"""Admin local event moderation audit constants (ADMIN-05D-A)."""

from __future__ import annotations

from enum import StrEnum

EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT = 20
EVENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX = 50

EVENT_ADMIN_ACTIONS: frozenset[str] = frozenset({"approve", "reject", "cancel"})

EVENT_ADMIN_APPROVE_REASON = "Événement approuvé."


class EventAdminAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    CANCEL = "cancel"
