"""Pure query helpers for admin creator content command center (CREATOR-CONTENT-V2-01)."""

from __future__ import annotations


def normalize_admin_creator_content_title_query(raw: str | None) -> str | None:
    """Return a trimmed title query or None when empty."""
    if raw is None:
        return None
    trimmed = raw.strip()
    return trimmed or None
