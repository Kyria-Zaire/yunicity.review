"""Admin citizen reports read API constants (ADMIN-07B)."""

from __future__ import annotations

from app.core.feed_constants import ReportReason, ReportStatus

REPORT_ADMIN_LIST_PAGE_SIZE_DEFAULT = 20
REPORT_ADMIN_LIST_PAGE_SIZE_MAX = 50

REPORT_STATUSES: frozenset[str] = frozenset(m.value for m in ReportStatus)
REPORT_REASONS: frozenset[str] = frozenset(m.value for m in ReportReason)
