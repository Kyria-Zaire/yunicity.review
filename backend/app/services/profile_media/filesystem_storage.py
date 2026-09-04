"""Filesystem storage for profile avatar/banner — DEV/QA local only."""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path

from app.core.config import Settings
from app.core.errors import AppError
from app.core.profile_media_constants import ProfileMediaKind
from app.core.profile_media_policy import (
    resolve_profile_media_upload_dir,
    validate_profile_media_storage_config,
)
from app.services.profile_media.storage_keys import list_profile_media_variant_keys

_STORAGE_KEY_RE = re.compile(
    r"^profiles/"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/"
    r"(avatar|banner)\.(jpg|png|webp)$",
    re.IGNORECASE,
)

_CONTENT_TYPE_BY_EXT = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def assert_valid_profile_media_key(storage_key: str) -> str:
    normalized = storage_key.replace("\\", "/").lstrip("/")
    if ".." in normalized.split("/") or not _STORAGE_KEY_RE.fullmatch(normalized):
        raise AppError(
            status_code=400,
            code="PROFILE_MEDIA_INVALID_STORAGE_KEY",
            detail="Clé de stockage profil invalide.",
        )
    return normalized


class ProfileMediaFilesystemStorage:
    def __init__(self, settings: Settings) -> None:
        validate_profile_media_storage_config(settings)
        self._settings = settings
        self._root = resolve_profile_media_upload_dir(
            settings.profile_media_upload_dir,
            app_env=settings.app_env,
        )
        self._root.mkdir(parents=True, exist_ok=True)

    def public_url(self, storage_key: str) -> str:
        key = assert_valid_profile_media_key(storage_key)
        _prefix, user_id, filename = key.split("/")
        prefix = self._settings.api_v1_prefix.rstrip("/")
        return f"{prefix}/profile-media/{user_id}/{filename}"

    def _dest_for_key(self, storage_key: str) -> Path:
        key = assert_valid_profile_media_key(storage_key)
        dest = (self._root / key).resolve()
        try:
            dest.relative_to(self._root.resolve())
        except ValueError as exc:
            raise AppError(
                status_code=400,
                code="PROFILE_MEDIA_INVALID_STORAGE_KEY",
                detail="Clé de stockage profil invalide.",
            ) from exc
        return dest

    def delete_existing_variants(self, user_id: uuid.UUID, kind: ProfileMediaKind) -> None:
        for key in list_profile_media_variant_keys(user_id, kind):
            dest = self._root / key
            if dest.is_file():
                dest.unlink()

    def put_object(self, storage_key: str, data: bytes, content_type: str) -> None:
        del content_type
        dest = self._dest_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(f".{dest.name}.{uuid.uuid4().hex}.tmp")
        try:
            tmp.write_bytes(data)
            os.replace(tmp, dest)
        except Exception:
            if tmp.exists():
                tmp.unlink()
            raise

    def resolve_public_file(self, user_id: uuid.UUID, filename: str) -> tuple[Path, str]:
        if "/" in filename or "\\" in filename or filename.startswith("."):
            raise AppError(
                status_code=404,
                code="PROFILE_MEDIA_NOT_FOUND",
                detail="Média introuvable.",
            )
        key = f"profiles/{user_id}/{filename}"
        dest = self._dest_for_key(key)
        if not dest.is_file():
            raise AppError(
                status_code=404,
                code="PROFILE_MEDIA_NOT_FOUND",
                detail="Média introuvable.",
            )
        content_type = _CONTENT_TYPE_BY_EXT.get(dest.suffix.lower())
        if content_type is None:
            raise AppError(
                status_code=404,
                code="PROFILE_MEDIA_NOT_FOUND",
                detail="Média introuvable.",
            )
        return dest, content_type
