"""Serve filesystem profile media over /api/v1."""

from __future__ import annotations

import uuid

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.errors import AppError
from app.services.profile_media.filesystem_storage import ProfileMediaFilesystemStorage

router = APIRouter(tags=["profile-media"])


@router.get("/profile-media/{user_id}/{filename}")
async def get_profile_media_file(user_id: uuid.UUID, filename: str) -> FileResponse:
    settings = get_settings()
    if settings.profile_media_storage_backend != "filesystem":
        raise AppError(
            status_code=404,
            code="PROFILE_MEDIA_NOT_FOUND",
            detail="Média introuvable.",
        )
    storage = ProfileMediaFilesystemStorage(settings)
    path, content_type = storage.resolve_public_file(user_id, filename)
    return FileResponse(
        path=path,
        media_type=content_type,
        headers={"X-Content-Type-Options": "nosniff"},
    )
