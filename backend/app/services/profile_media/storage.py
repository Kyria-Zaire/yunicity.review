"""Profile media storage factory — filesystem (dev) or R2 (recette+)."""

from __future__ import annotations

from typing import Protocol

from app.core.config import Settings
from app.core.profile_media_constants import ProfileMediaKind
from app.core.profile_media_policy import validate_profile_media_storage_config
from app.services.profile_media.filesystem_storage import ProfileMediaFilesystemStorage
from app.services.profile_media.r2_storage import ProfileMediaR2Storage


class ProfileMediaStorage(Protocol):
    def public_url(self, storage_key: str) -> str: ...

    def delete_existing_variants(self, user_id, kind: ProfileMediaKind) -> None: ...

    def put_object(self, storage_key: str, data: bytes, content_type: str) -> None: ...


def build_profile_media_storage(settings: Settings) -> ProfileMediaStorage:
    validate_profile_media_storage_config(settings)
    if settings.profile_media_storage_backend == "filesystem":
        return ProfileMediaFilesystemStorage(settings)
    return ProfileMediaR2Storage(settings)
