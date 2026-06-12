"""Local Video object storage (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Protocol

from app.core.config import Settings


@dataclass(frozen=True)
class ObjectHead:
    content_length: int
    content_type: str | None


@dataclass(frozen=True)
class PresignedUpload:
    storage_key: str
    upload_url: str
    upload_method: str
    upload_headers: dict[str, str]
    expires_at: datetime


class LocalVideoStorage(Protocol):
    def build_source_key(self, *, user_id: uuid.UUID, upload_id: uuid.UUID, ext: str) -> str: ...

    def build_derivative_key(
        self, *, user_id: uuid.UUID, video_id: uuid.UUID, name: str
    ) -> str: ...

    def create_presigned_upload(
        self,
        *,
        upload_id: uuid.UUID,
        storage_key: str,
        content_type: str,
        ttl_seconds: int,
    ) -> PresignedUpload: ...

    def head_object(self, storage_key: str) -> ObjectHead | None: ...

    def public_url(self, storage_key: str) -> str: ...

    def write_bytes(self, storage_key: str, data: bytes, content_type: str) -> None: ...

    def read_to_path(self, storage_key: str, dest: Path) -> None: ...

    def upload_file(self, local_path: Path, storage_key: str, content_type: str) -> None: ...


def build_local_video_storage(settings: Settings) -> LocalVideoStorage:
    if settings.local_video_storage_backend == "r2":
        from app.services.local_video.r2_storage import R2LocalVideoStorage

        return R2LocalVideoStorage(settings)
    from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage

    return FilesystemLocalVideoStorage(settings)


def storage_key_prefix(settings: Settings) -> str:
    return f"local-video/{settings.app_env}/reims"
