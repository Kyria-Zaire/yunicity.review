"""Serve filesystem story/post media over /api/v1 (C3.1-R1D)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.errors import AppError
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage

router = APIRouter(tags=["story-media"])


@router.get("/story-media/{user_id}/{filename}")
async def get_story_media_file(user_id: uuid.UUID, filename: str) -> FileResponse:
    settings = get_settings()
    if settings.story_media_storage_backend != "filesystem":
        raise AppError(
            status_code=404,
            code="STORY_MEDIA_NOT_FOUND",
            detail="Média introuvable.",
        )
    if "/" in filename or "\\" in filename or filename.startswith("."):
        raise AppError(
            status_code=404,
            code="STORY_MEDIA_NOT_FOUND",
            detail="Média introuvable.",
        )
    storage = StoryMediaFilesystemStorage(settings)
    path, content_type = storage.resolve_public_file(user_id, filename)
    return FileResponse(
        path=path,
        media_type=content_type,
        headers={"X-Content-Type-Options": "nosniff"},
    )
