"""Pure query helpers for admin local events agenda (EVENTS-V2-01)."""

from __future__ import annotations

from datetime import datetime

from app.core.local_event_constants import LocalEventModerationStatus


def normalize_admin_event_title_query(raw: str | None) -> str | None:
    """Return a trimmed title query or None when empty."""
    if raw is None:
        return None
    trimmed = raw.strip()
    return trimmed or None


def local_event_counts_as_published(
    *,
    moderation_status: str,
    is_cancelled: bool,
) -> bool:
    """True when an event is approved and not cancelled."""
    return (
        moderation_status == LocalEventModerationStatus.APPROVED.value and not is_cancelled
    )


def local_event_counts_as_upcoming_published(
    *,
    moderation_status: str,
    is_cancelled: bool,
    starts_at: datetime,
    now: datetime,
) -> bool:
    """True when a published event starts in the future."""
    return local_event_counts_as_published(
        moderation_status=moderation_status,
        is_cancelled=is_cancelled,
    ) and starts_at >= now
