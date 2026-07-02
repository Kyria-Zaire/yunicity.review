"""R2 object keys for story media."""

from __future__ import annotations

import uuid


def build_story_media_key(user_id: uuid.UUID, media_id: uuid.UUID, ext: str) -> str:
    normalized_ext = ext if ext.startswith(".") else f".{ext}"
    return f"stories/{user_id}/{media_id}{normalized_ext}"
