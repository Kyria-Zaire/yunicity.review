"""Cloudflare R2 storage for story media (PILOT-FIX-03)."""

from __future__ import annotations

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]

from app.core.config import Settings
from app.core.errors import AppError
from app.core.story_media_policy import validate_story_media_storage_config


class StoryMediaR2Storage:
    def __init__(self, settings: Settings) -> None:
        validate_story_media_storage_config(settings)
        if not settings.local_video_r2_endpoint or not settings.local_video_r2_bucket:
            raise AppError(
                status_code=500,
                code="STORY_MEDIA_R2_MISCONFIGURED",
                detail="Configuration R2 story incomplète.",
            )
        if (
            not settings.local_video_r2_access_key_id
            or not settings.local_video_r2_secret_access_key
        ):
            raise AppError(
                status_code=500,
                code="STORY_MEDIA_R2_MISCONFIGURED",
                detail="Identifiants R2 story manquants.",
            )
        self._settings = settings
        self._bucket = settings.local_video_r2_bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.local_video_r2_endpoint,
            aws_access_key_id=settings.local_video_r2_access_key_id,
            aws_secret_access_key=settings.local_video_r2_secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def public_url(self, storage_key: str) -> str:
        base = self._settings.local_video_public_base_url.rstrip("/")
        return f"{base}/{storage_key}"

    def put_object(self, storage_key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=storage_key,
            Body=data,
            ContentType=content_type,
        )


def build_story_media_storage(settings: Settings) -> StoryMediaR2Storage:
    return StoryMediaR2Storage(settings)
