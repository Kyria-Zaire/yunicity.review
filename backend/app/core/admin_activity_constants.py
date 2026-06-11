"""Admin activity center constants (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

from typing import Literal

AdminActivityAlertSeverity = Literal["healthy", "warning", "critical"]
AdminActivityHealthStatus = Literal["healthy", "degraded", "critical"]
AdminActivityFeedSeverity = Literal["info", "success", "warning", "critical"]
AdminActivityFeedCategory = Literal[
    "partner",
    "passport",
    "offer",
    "event",
    "creator",
    "moderation",
    "staff",
    "system",
    "report",
]

ACTIVITY_ALERT_COUNT_CRITICAL_THRESHOLD = 5

ACTIVITY_FEED_LIMIT_DEFAULT = 25
ACTIVITY_FEED_LIMIT_MAX = 100

ACTIVITY_FEED_CATEGORIES: frozenset[str] = frozenset(
    {
        "all",
        "partner",
        "passport",
        "offer",
        "event",
        "creator",
        "moderation",
        "staff",
        "system",
        "report",
    }
)

MODERATION_FEED_CATEGORIES: frozenset[str] = frozenset({"offer", "event", "creator", "report"})
