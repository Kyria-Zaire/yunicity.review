"""Pure helpers for admin moderation command center (MODERATION-V2-01)."""

from __future__ import annotations

from collections.abc import Mapping


def resolve_dominant_report_reason(
    reason_counts: Mapping[str, int],
) -> str | None:
    """Return the reason key with the highest count, or None when empty."""
    if not reason_counts:
        return None
    best_count = max(reason_counts.values())
    return min(reason for reason, count in reason_counts.items() if count == best_count)
