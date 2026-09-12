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


def _invalid_cursor(cause: Exception | None = None) -> AppError:
    err = AppError(
        status_code=400,
        code="INVALID_CURSOR",
        detail="Curseur de pagination invalide.",
    )
    if cause is not None:
        raise err from cause
    return err


def encode_local_video_feed_cursor(
    published_at: datetime,
    video_id: uuid.UUID,
    tier: int | None = None,
) -> str:
    """Curseur keyset du feed.

    VIDEO-03 ajoute le tier de classement en tete : l'ordre total est
    `(tier ASC, published_at DESC, id DESC)`, donc paginer sans le tier
    melangerait les tiers d'une page a l'autre. Le format historique a deux
    segments reste emis quand aucun tier n'est fourni, et reste decodable.
    """
    if tier is None:
        return _encode_segment(f"{published_at.isoformat()}|{video_id}")
    return _encode_segment(f"{tier}|{published_at.isoformat()}|{video_id}")


def decode_local_video_feed_cursor(cursor: str) -> tuple[int | None, datetime, uuid.UUID]:
    """Retourne `(tier | None, published_at, video_id)`.

    `tier` vaut None pour un curseur historique a deux segments : le classement
    retombe alors sur le predicat keyset d'origine, ce qui garde les clients
    deja en vol fonctionnels.
    """
    parts = _decode_segment(cursor).split("|")
    if len(parts) == 2:
        tier_raw, published_raw, id_raw = None, parts[0], parts[1]
    elif len(parts) == 3:
        tier_raw, published_raw, id_raw = parts[0], parts[1], parts[2]
    else:
        raise _invalid_cursor()

    try:
        tier = int(tier_raw) if tier_raw is not None else None
        return tier, datetime.fromisoformat(published_raw), uuid.UUID(id_raw)
    except (ValueError, TypeError) as exc:
        _invalid_cursor(exc)
        raise  # pragma: no cover - _invalid_cursor leve toujours
