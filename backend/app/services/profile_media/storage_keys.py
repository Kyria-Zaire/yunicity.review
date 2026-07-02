"""R2 object keys for profile media."""

from __future__ import annotations

import uuid

from app.core.profile_media_constants import ProfileMediaKind

PROFILE_MEDIA_EXTENSIONS = (".jpg", ".png", ".webp")


def build_profile_media_key(
    user_id: uuid.UUID,
    kind: ProfileMediaKind,
    ext: str,
) -> str:
    normalized_ext = ext if ext.startswith(".") else f".{ext}"
    return f"profiles/{user_id}/{kind.value}{normalized_ext}"


def list_profile_media_variant_keys(user_id: uuid.UUID, kind: ProfileMediaKind) -> list[str]:
    return [
        build_profile_media_key(user_id, kind, ext)
        for ext in PROFILE_MEDIA_EXTENSIONS
    ]
