"""User notification preferences (TICKET-503)."""

from __future__ import annotations

from typing import Any

DEFAULT_NOTIFICATION_PREFERENCES: dict[str, bool] = {
    "social": True,
    "passport": True,
    "offers": True,
}

PREFERENCE_KEY_SOCIAL = "social"
PREFERENCE_KEY_PASSPORT = "passport"
PREFERENCE_KEY_OFFERS = "offers"


def merge_notification_preferences(raw: dict[str, Any] | None) -> dict[str, bool]:
    merged = dict(DEFAULT_NOTIFICATION_PREFERENCES)
    if raw:
        for key, value in raw.items():
            if key in merged and isinstance(value, bool):
                merged[key] = value
    return merged


def is_notification_enabled(
    raw: dict[str, Any] | None,
    *,
    key: str,
) -> bool:
    return merge_notification_preferences(raw).get(key, True)
