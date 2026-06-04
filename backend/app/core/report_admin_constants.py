"""Admin citizen reports API constants (ADMIN-07B / ADMIN-07D-A)."""

from __future__ import annotations

from enum import StrEnum

from app.core.feed_constants import ReportReason, ReportStatus

REPORT_ADMIN_LIST_PAGE_SIZE_DEFAULT = 20
REPORT_ADMIN_LIST_PAGE_SIZE_MAX = 50

REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT = 20
REPORT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX = 50

REPORT_RESOLUTION_NOTE_MAX_LENGTH = 1000
REPORT_RESOLUTION_NOTE_HIDE_POST_MIN_LENGTH = 3

REPORT_STATUSES: frozenset[str] = frozenset(m.value for m in ReportStatus)
REPORT_REASONS: frozenset[str] = frozenset(m.value for m in ReportReason)


class ReportAdminActionType(StrEnum):
    DISMISS = "dismiss"
    RESOLVE = "resolve"
    RESOLVE_HIDE_POST = "resolve_hide_post"
