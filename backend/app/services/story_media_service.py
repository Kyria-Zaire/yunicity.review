"""Story media upload (WEB-STORIES-02, PILOT-FIX-03 R2)."""

from __future__ import annotations

import uuid

from fastapi import UploadFile

from app.core.config import Settings
from app.core.errors import AppError
from app.core.media_magic_bytes import (
    ContentTypeMismatchError,
    assert_content_matches_declared_type,
)
from app.core.story_constants import STORY_MEDIA_MAX_BYTES
from app.models.user import User
from app.services.story_media.r2_storage import build_story_media_storage
from app.services.story_media.storage_keys import build_story_media_key

ALLOWED_IMAGE_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
ALLOWED_VIDEO_TYPES = frozenset({"video/mp4"})
ALLOWED_MEDIA_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
}


class StoryMediaService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._storage = build_story_media_storage(settings)

    async def upload(self, user: User, upload: UploadFile) -> tuple[str, str]:
        content_type = (upload.content_type or "").split(";", 1)[0].strip().lower()
        if content_type not in ALLOWED_MEDIA_TYPES:
            raise AppError(
                status_code=400,
                code="STORY_MEDIA_INVALID_TYPE",
                detail="Format non supporté. Utilisez JPG, PNG, WEBP ou MP4.",
            )

        data = await upload.read()
        if not data:
            raise AppError(
                status_code=400,
                code="STORY_MEDIA_EMPTY",
                detail="Fichier vide.",
            )
        if len(data) > STORY_MEDIA_MAX_BYTES:
            raise AppError(
                status_code=400,
                code="STORY_MEDIA_TOO_LARGE",
                detail="Fichier trop volumineux (max. 20 Mo).",
            )

        try:
            assert_content_matches_declared_type(data, content_type)
        except ContentTypeMismatchError as exc:
            raise AppError(
                status_code=400,
                code="STORY_MEDIA_INVALID_CONTENT",
                detail=str(exc),
            ) from exc

        ext = EXTENSION_BY_MIME.get(content_type, ".bin")
        media_type = "video" if content_type in ALLOWED_VIDEO_TYPES else "image"
        media_id = uuid.uuid4()
        storage_key = build_story_media_key(user.id, media_id, ext)

        self._storage.put_object(storage_key, data, content_type)
        return self._storage.public_url(storage_key), media_type
