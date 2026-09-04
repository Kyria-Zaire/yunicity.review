"""Cloudflare R2 storage for profile avatar/banner (PILOT-FIX-02)."""

from __future__ import annotations

import uuid

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import ClientError  # type: ignore[import-untyped]

from app.core.config import Settings
from app.core.errors import AppError
from app.core.profile_media_constants import ProfileMediaKind
from app.core.profile_media_policy import validate_profile_media_storage_config
from app.services.profile_media.storage_keys import list_profile_media_variant_keys


class ProfileMediaR2Storage:
    def __init__(self, settings: Settings) -> None:
        validate_profile_media_storage_config(settings)
        if settings.profile_media_storage_backend != "r2":
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_R2_MISCONFIGURED",
                detail="Backend R2 profil non sélectionné.",
            )
        if not settings.local_video_r2_endpoint or not settings.local_video_r2_bucket:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_R2_MISCONFIGURED",
                detail="Configuration R2 profil incomplète.",
            )
        if (
            not settings.local_video_r2_access_key_id
            or not settings.local_video_r2_secret_access_key
        ):
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_R2_MISCONFIGURED",
                detail="Identifiants R2 profil manquants.",
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

    def delete_existing_variants(self, user_id: uuid.UUID, kind: ProfileMediaKind) -> None:
        for key in list_profile_media_variant_keys(user_id, kind):
            try:
                self._client.delete_object(Bucket=self._bucket, Key=key)
            except ClientError:
                continue

    def put_object(self, storage_key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=storage_key,
            Body=data,
            ContentType=content_type,
        )
