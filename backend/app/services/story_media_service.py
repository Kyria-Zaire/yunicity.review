"""Story media upload (WEB-STORIES-02)."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import Settings
from app.core.errors import AppError
from app.core.story_constants import STORY_MEDIA_MAX_BYTES
from app.models.user import User

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

        ext = EXTENSION_BY_MIME.get(content_type, Path(upload.filename or "").suffix or ".bin")
        media_type = "video" if content_type in ALLOWED_VIDEO_TYPES else "image"

        base_dir = Path(self._settings.media_upload_dir) / "stories" / str(user.id)
        base_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        target = base_dir / filename
        target.write_bytes(data)

        public_base = self._settings.media_public_base_url.rstrip("/")
        url = f"{public_base}/media/stories/{user.id}/{filename}"
        return url, media_type
