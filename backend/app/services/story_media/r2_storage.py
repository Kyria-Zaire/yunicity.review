"""Cloudflare R2 storage for story media (PILOT-FIX-03 + STORY-MEDIA-AUTHORIZATION-01)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import boto3  # type: ignore[import-untyped]
from app.core.config import Settings
from app.core.errors import AppError
from app.core.story_media_policy import validate_story_media_storage_config
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage
from app.services.story_media.storage_keys import (
    CONTENT_TYPE_BY_EXT,
    assert_valid_story_media_key,
    story_media_api_url,
)
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import ClientError  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StoryMediaObject:
    """Objet R2 ouvert en flux, pret a etre relaye par la route protegee."""

    body: Any
    content_type: str
    content_length: int | None
    content_range: str | None
    partial: bool


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
        """Route API protegee -- JAMAIS l'URL CDN absolue.

        L'ancienne version renvoyait `{CDN}/{cle}` : l'objet devenait joignable sans
        passer par l'autorisation d'audience. Le backend R2 partage desormais la meme
        construction d'URL que le filesystem.
        """
        return story_media_api_url(self._settings.api_v1_prefix, storage_key)

    def open_object(
        self,
        storage_key: str,
        *,
        range_header: str | None = None,
    ) -> StoryMediaObject:
        """Ouvre l'objet R2 COTE SERVEUR, en flux, sans jamais rediriger le client.

        `Range` est transmis a R2 : seule la tranche demandee traverse le reseau, donc
        une video de plusieurs dizaines de Mo n'est jamais chargee en memoire.
        """
        key = assert_valid_story_media_key(storage_key)
        params: dict[str, str] = {"Bucket": self._bucket, "Key": key}
        if range_header:
            params["Range"] = range_header
        try:
            response = self._client.get_object(**params)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in ("NoSuchKey", "404", "NotFound"):
                raise AppError(
                    status_code=404,
                    code="STORY_MEDIA_NOT_FOUND",
                    detail="Média introuvable.",
                ) from exc
            if code in ("InvalidRange", "416"):
                raise AppError(
                    status_code=416,
                    code="STORY_MEDIA_RANGE_INVALID",
                    detail="Plage demandée invalide.",
                ) from exc
            # La cle et les identifiants ne doivent jamais atterrir dans les logs.
            logger.warning("story_media_r2_read_failed code=%s", code)
            raise AppError(
                status_code=502,
                code="STORY_MEDIA_UPSTREAM_ERROR",
                detail="Média temporairement indisponible.",
            ) from exc

        ext = key[key.rfind(".") :].lower()
        return StoryMediaObject(
            body=response["Body"],
            content_type=response.get("ContentType") or CONTENT_TYPE_BY_EXT.get(ext, ""),
            content_length=response.get("ContentLength"),
            content_range=response.get("ContentRange"),
            partial=bool(response.get("ContentRange")),
        )

    def put_object(self, storage_key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=storage_key,
            Body=data,
            ContentType=content_type,
        )


def build_story_media_storage(
    settings: Settings,
) -> StoryMediaR2Storage | StoryMediaFilesystemStorage:
    validate_story_media_storage_config(settings)
    if settings.story_media_storage_backend == "filesystem":
        return StoryMediaFilesystemStorage(settings)
    return StoryMediaR2Storage(settings)
