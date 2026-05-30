"""Discussions list pagination cursor."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.core.errors import AppError
from app.core.feed_cursor import _decode_segment, _encode_segment


def encode_discussion_cursor(comment_count: int, created_at: datetime, post_id: uuid.UUID) -> str:
    return _encode_segment(f"{comment_count}|{created_at.isoformat()}|{post_id}")


def decode_discussion_cursor(cursor: str) -> tuple[int, datetime, uuid.UUID]:
    parts = _decode_segment(cursor).split("|", 2)
    if len(parts) != 3:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        )
    try:
        comment_count = int(parts[0])
        created_at = datetime.fromisoformat(parts[1])
        post_id = uuid.UUID(parts[2])
    except (ValueError, TypeError) as exc:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        ) from exc
    return comment_count, created_at, post_id
