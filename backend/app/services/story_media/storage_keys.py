"""Cles d'objet et URL publique des medias de story.

Source UNIQUE partagee par les deux backends. Le backend R2 construisait auparavant une
URL CDN absolue : elle contournait la route d'autorisation, alors que la variante
filesystem passait deja par l'API. Les deux derivent desormais de `story_media_api_url`,
donc aucun backend ne peut reintroduire un acces direct par simple divergence.
"""

from __future__ import annotations

import re
import uuid

from app.core.errors import AppError

_STORAGE_KEY_RE = re.compile(
    r"^stories/"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    r"\.(jpg|png|webp|mp4|webm)$",
    re.IGNORECASE,
)

CONTENT_TYPE_BY_EXT = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
}


def build_story_media_key(user_id: uuid.UUID, media_id: uuid.UUID, ext: str) -> str:
    normalized_ext = ext if ext.startswith(".") else f".{ext}"
    return f"stories/{user_id}/{media_id}{normalized_ext}"


def assert_valid_story_media_key(storage_key: str) -> str:
    normalized = storage_key.replace("\\", "/").lstrip("/")
    if ".." in normalized.split("/") or not _STORAGE_KEY_RE.fullmatch(normalized):
        raise AppError(
            status_code=400,
            code="STORY_MEDIA_INVALID_STORAGE_KEY",
            detail="Clé de stockage média invalide.",
        )
    return normalized


def story_media_api_url(api_v1_prefix: str, storage_key: str) -> str:
    """URL enregistree en base : TOUJOURS la route protegee, jamais un objet direct."""
    key = assert_valid_story_media_key(storage_key)
    _prefix, user_id, filename = key.split("/")
    return f"{api_v1_prefix.rstrip('/')}/story-media/{user_id}/{filename}"


def story_media_key_for(user_id: uuid.UUID, filename: str) -> str:
    """Cle confinee derivee des segments d'URL, validee avant tout acces au stockage."""
    return assert_valid_story_media_key(f"stories/{user_id}/{filename}")
