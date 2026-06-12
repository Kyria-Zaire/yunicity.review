"""Local Video feed pagination cursors (FEATURE-CREATORS-V2 / C2-S2-00)."""

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


def encode_local_video_feed_cursor(published_at: datetime, video_id: uuid.UUID) -> str:
    return _encode_segment(f"{published_at.isoformat()}|{video_id}")


def decode_local_video_feed_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
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
