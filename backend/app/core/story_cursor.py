"""Cursor pagination for stories."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.core.feed_cursor import _decode_segment, _encode_segment


def encode_story_cursor(created_at: datetime, post_id: uuid.UUID) -> str:
    return _encode_segment(f"{created_at.isoformat()}|{post_id}")


def decode_story_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    raw = _decode_segment(cursor)
    created_at_raw, post_id_raw = raw.split("|", 1)
    return datetime.fromisoformat(created_at_raw), uuid.UUID(post_id_raw)
