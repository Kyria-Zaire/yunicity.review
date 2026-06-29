"""Object key layout for Local Video media (VIDEO-01B)."""

from __future__ import annotations

import uuid

LOCAL_VIDEO_KEY_ROOT = "local-video"


def build_source_upload_key(*, city_slug: str, video_id: uuid.UUID, ext: str) -> str:
    normalized_ext = ext if ext.startswith(".") else f".{ext}"
    return f"{LOCAL_VIDEO_KEY_ROOT}/{city_slug}/{video_id}/source{normalized_ext}"


def build_processed_key(*, city_slug: str, video_id: uuid.UUID) -> str:
    return f"{LOCAL_VIDEO_KEY_ROOT}/{city_slug}/{video_id}/processed.mp4"


def build_thumbnail_key(*, city_slug: str, video_id: uuid.UUID) -> str:
    return f"{LOCAL_VIDEO_KEY_ROOT}/{city_slug}/{video_id}/thumbnail.jpg"


def city_slug_from_storage_key(storage_key: str) -> str | None:
    parts = storage_key.strip("/").split("/")
    if len(parts) >= 4 and parts[0] == LOCAL_VIDEO_KEY_ROOT:
        return parts[1]
    return None
