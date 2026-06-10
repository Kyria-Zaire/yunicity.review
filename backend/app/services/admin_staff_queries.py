"""Pure helpers for admin staff command center (STAFF-V10-01)."""

from __future__ import annotations

from collections.abc import Mapping


def resolve_dominant_staff_role(
    role_counts: Mapping[str, int],
) -> str | None:
    """Return the role key with the highest assignment count, or None when empty."""
    if not role_counts:
        return None
    best_count = max(role_counts.values())
    return min(role for role, count in role_counts.items() if count == best_count)
