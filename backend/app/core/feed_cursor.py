"""Feed pagination cursors (TICKET-402)."""

from __future__ import annotations

import base64
import uuid
from datetime import datetime

from app.core.errors import AppError


def _encode_segment(raw: str) -> str:
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def _decode_segment(cursor: str) -> str:
    padding = "=" * (-len(cursor) % 4)
    try:
        return base64.urlsafe_b64decode((cursor + padding).encode("ascii")).decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        ) from exc


def encode_feed_cursor(priority: int, created_at: datetime, post_id: uuid.UUID) -> str:
    raw = f"{priority}|{created_at.isoformat()}|{post_id}"
    return _encode_segment(raw)


def decode_feed_cursor(cursor: str) -> tuple[int, datetime, uuid.UUID]:
    parts = _decode_segment(cursor).split("|", 2)
    if len(parts) != 3:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        )
    try:
        priority = int(parts[0])
        created_at = datetime.fromisoformat(parts[1])
        post_id = uuid.UUID(parts[2])
    except (ValueError, TypeError) as exc:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        ) from exc
    return priority, created_at, post_id


def encode_comment_cursor(created_at: datetime, comment_id: uuid.UUID) -> str:
    return _encode_segment(f"{created_at.isoformat()}|{comment_id}")


def decode_comment_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    parts = _decode_segment(cursor).split("|", 1)
    if len(parts) != 2:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        )
    try:
        return datetime.fromisoformat(parts[0]), uuid.UUID(parts[1])
    except (ValueError, TypeError) as exc:
        raise AppError(
            status_code=400,
            code="INVALID_CURSOR",
            detail="Curseur de pagination invalide.",
        ) from exc
