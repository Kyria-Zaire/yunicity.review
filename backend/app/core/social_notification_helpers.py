"""Helpers for social notifications (TICKET-503)."""

from __future__ import annotations

import uuid

from app.core.social_notification_constants import POST_EXCERPT_MAX_LENGTH


def skip_notification_if_self(actor_id: uuid.UUID, target_user_id: uuid.UUID) -> bool:
    """Return True when notification should be skipped (same user)."""
    return actor_id == target_user_id


def build_post_excerpt(body: str | None) -> str | None:
    if not body:
        return None
    trimmed = body.strip()
    if not trimmed:
        return None
    if len(trimmed) <= POST_EXCERPT_MAX_LENGTH:
        return trimmed
    return f"{trimmed[: POST_EXCERPT_MAX_LENGTH - 1].rstrip()}…"


def build_feed_deeplink(post_id: uuid.UUID) -> str:
    return f"/feed?post={post_id}"
