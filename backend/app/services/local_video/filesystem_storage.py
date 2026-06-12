"""Filesystem fallback storage for Local Video dev/CI."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.core.config import Settings
from app.services.local_video.storage import ObjectHead, PresignedUpload, storage_key_prefix


class FilesystemLocalVideoStorage:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._root = Path(settings.media_upload_dir) / "local-video"
        self._root.mkdir(parents=True, exist_ok=True)
        self._api_base = settings.media_public_base_url.rstrip("/")

    def _path_for_key(self, storage_key: str) -> Path:
        safe = storage_key.replace("..", "").lstrip("/")
        return self._root / safe

    def build_source_key(self, *, user_id: uuid.UUID, upload_id: uuid.UUID, ext: str) -> str:
        prefix = storage_key_prefix(self._settings)
        return f"{prefix}/{user_id}/{upload_id}/source{ext}"

    def build_derivative_key(self, *, user_id: uuid.UUID, video_id: uuid.UUID, name: str) -> str:
        prefix = storage_key_prefix(self._settings)
        return f"{prefix}/{user_id}/{video_id}/{name}"

    def create_presigned_upload(
        self,
        *,
        upload_id: uuid.UUID,
        storage_key: str,
        content_type: str,
        ttl_seconds: int,
    ) -> PresignedUpload:
        expires_at = datetime.now(tz=UTC) + timedelta(seconds=ttl_seconds)
        prefix = self._settings.api_v1_prefix.rstrip("/")
        upload_url = (
            f"{self._api_base}{prefix}/local-videos/uploads/{upload_id}/binary"
        )
        return PresignedUpload(
            storage_key=storage_key,
            upload_url=upload_url,
            upload_method="PUT",
            upload_headers={"Content-Type": content_type},
            expires_at=expires_at,
        )

    def head_object(self, storage_key: str) -> ObjectHead | None:
        path = self._path_for_key(storage_key)
        if not path.is_file():
            return None
        return ObjectHead(content_length=path.stat().st_size, content_type=None)

    def public_url(self, storage_key: str) -> str:
        safe = storage_key.replace("..", "").lstrip("/")
        return f"{self._settings.local_video_public_base_url}/media/local-video/{safe}"

    def write_bytes(self, storage_key: str, data: bytes, content_type: str) -> None:
        del content_type
        path = self._path_for_key(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read_to_path(self, storage_key: str, dest: Path) -> None:
        src = self._path_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(src.read_bytes())

    def upload_file(self, local_path: Path, storage_key: str, content_type: str) -> None:
        del content_type
        dest = self._path_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(local_path.read_bytes())
