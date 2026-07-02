"""Profile avatar and banner file upload (PILOT-FIX-02)."""

from __future__ import annotations

from fastapi import UploadFile

from app.core.config import Settings
from app.core.errors import AppError
from app.core.media_magic_bytes import ContentTypeMismatchError, assert_content_matches_declared_type
from app.core.profile_media_constants import (
    PROFILE_AVATAR_MAX_BYTES,
    PROFILE_BANNER_MAX_BYTES,
    ProfileMediaKind,
)
from app.models.user import User
from app.services.profile_media.r2_storage import build_profile_media_storage
from app.services.profile_media.storage_keys import build_profile_media_key

ALLOWED_IMAGE_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})

EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class ProfileMediaService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._storage = build_profile_media_storage(settings)

    async def upload(self, user: User, upload: UploadFile, kind: ProfileMediaKind) -> str:
        content_type = (upload.content_type or "").split(";", 1)[0].strip().lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise AppError(
                status_code=400,
                code="PROFILE_MEDIA_INVALID_TYPE",
                detail="Format non supporté. Utilisez JPG, PNG ou WEBP.",
            )

        data = await upload.read()
        if not data:
            raise AppError(
                status_code=400,
                code="PROFILE_MEDIA_EMPTY",
                detail="Fichier vide.",
            )

        max_bytes = (
            PROFILE_AVATAR_MAX_BYTES
            if kind is ProfileMediaKind.AVATAR
            else PROFILE_BANNER_MAX_BYTES
        )
        if len(data) > max_bytes:
            max_mb = max_bytes // (1024 * 1024)
            raise AppError(
                status_code=400,
                code="PROFILE_MEDIA_TOO_LARGE",
                detail=f"Fichier trop volumineux (max. {max_mb} Mo).",
            )

        try:
            assert_content_matches_declared_type(data, content_type)
        except ContentTypeMismatchError as exc:
            raise AppError(
                status_code=400,
                code="PROFILE_MEDIA_INVALID_CONTENT",
                detail=str(exc),
            ) from exc

        ext = EXTENSION_BY_MIME.get(content_type, ".bin")
        storage_key = build_profile_media_key(user.id, kind, ext)

        self._storage.delete_existing_variants(user.id, kind)
        self._storage.put_object(storage_key, data, content_type)
        return self._storage.public_url(storage_key)
