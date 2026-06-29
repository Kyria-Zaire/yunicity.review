"""Cloudflare R2 storage for Local Video (S3-compatible)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import ClientError  # type: ignore[import-untyped]

from app.core.config import Settings
from app.core.errors import AppError
from app.services.local_video.storage import ObjectHead, PresignedUpload
from app.services.local_video.storage_keys import (
    build_processed_key,
    build_source_upload_key,
    build_thumbnail_key,
)


class R2LocalVideoStorage:
    def __init__(self, settings: Settings) -> None:
        if not settings.local_video_r2_endpoint:
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_R2_MISCONFIGURED",
                detail="LOCAL_VIDEO_R2_ENDPOINT manquant.",
            )
        if not settings.local_video_r2_bucket:
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_R2_MISCONFIGURED",
                detail="LOCAL_VIDEO_R2_BUCKET manquant.",
            )
        if (
            not settings.local_video_r2_access_key_id
            or not settings.local_video_r2_secret_access_key
        ):
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_R2_MISCONFIGURED",
                detail="Identifiants R2 manquants.",
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

    def build_source_key(self, *, city_slug: str, video_id: uuid.UUID, ext: str) -> str:
        return build_source_upload_key(city_slug=city_slug, video_id=video_id, ext=ext)

    def build_processed_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return build_processed_key(city_slug=city_slug, video_id=video_id)

    def build_thumbnail_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return build_thumbnail_key(city_slug=city_slug, video_id=video_id)

    def create_presigned_upload(
        self,
        *,
        upload_id: uuid.UUID,
        storage_key: str,
        content_type: str,
        content_length: int,
        ttl_seconds: int,
    ) -> PresignedUpload:
        del upload_id
        expires_at = datetime.now(tz=UTC) + timedelta(seconds=ttl_seconds)
        params: dict[str, str | int] = {
            "Bucket": self._bucket,
            "Key": storage_key,
            "ContentType": content_type,
            "ContentLength": content_length,
        }
        upload_url = self._client.generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=ttl_seconds,
            HttpMethod="PUT",
        )
        return PresignedUpload(
            storage_key=storage_key,
            upload_url=upload_url,
            upload_method="PUT",
            upload_headers={"Content-Type": content_type},
            expires_at=expires_at,
        )

    def head_object(self, storage_key: str) -> ObjectHead | None:
        try:
            response = self._client.head_object(Bucket=self._bucket, Key=storage_key)
        except ClientError:
            return None
        return ObjectHead(
            content_length=int(response.get("ContentLength", 0)),
            content_type=response.get("ContentType"),
        )

    def public_url(self, storage_key: str) -> str:
        base = self._settings.local_video_public_base_url.rstrip("/")
        return f"{base}/{storage_key}"

    def write_bytes(self, storage_key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=storage_key,
            Body=data,
            ContentType=content_type,
        )

    def read_to_path(self, storage_key: str, dest) -> None:  # type: ignore[no-untyped-def]
        response = self._client.get_object(Bucket=self._bucket, Key=storage_key)
        body = response["Body"].read()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)

    def upload_file(self, local_path, storage_key: str, content_type: str) -> None:  # type: ignore[no-untyped-def]
        self._client.upload_file(
            str(local_path),
            self._bucket,
            storage_key,
            ExtraArgs={"ContentType": content_type},
        )
