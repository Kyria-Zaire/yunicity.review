"""Cloudflare R2 storage for profile avatar/banner (PILOT-FIX-02 + PROFILE-MEDIA-R2-COMPAT-04)."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any

import boto3  # type: ignore[import-untyped]
from botocore.client import Config  # type: ignore[import-untyped]
from botocore.exceptions import ClientError  # type: ignore[import-untyped]

from app.core.config import Settings
from app.core.errors import AppError
from app.core.profile_media_constants import ProfileMediaKind
from app.core.profile_media_policy import validate_profile_media_storage_config
from app.services.profile_media.storage_keys import (
    CONTENT_TYPE_BY_EXT,
    assert_valid_profile_media_key,
    list_profile_media_variant_keys,
    profile_media_api_url,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProfileMediaObject:
    """Objet R2 ouvert en flux, relaye par la route publique."""

    body: Any
    content_type: str
    content_length: int | None


class ProfileMediaR2Storage:
    def __init__(self, settings: Settings, *, validate_backend: bool = True) -> None:
        """`validate_backend=False` pour un usage en REPLI.

        `validate_profile_media_storage_config` valide le backend COURANT : quand celui-ci
        est `filesystem` et que R2 ne sert qu'a lire une reference historique, elle
        validerait le repertoire filesystem, sans rapport avec ce que fait cet objet.
        Les exigences propres a R2 (endpoint, bucket, identifiants) restent verifiees
        dans tous les cas.
        """
        if validate_backend:
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
        """Route API -- JAMAIS l'URL CDN absolue.

        L'ancienne forme designait l'objet directement : elle sortait de l'application,
        donc de tout controle de reference. Les deux backends partagent desormais la
        meme construction.
        """
        return profile_media_api_url(self._settings.api_v1_prefix, storage_key)

    def open_object(self, storage_key: str) -> ProfileMediaObject:
        """Ouvre l'objet R2 COTE SERVEUR, en flux. Aucune redirection vers le CDN."""
        key = assert_valid_profile_media_key(storage_key)
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in ("NoSuchKey", "404", "NotFound"):
                raise AppError(
                    status_code=404,
                    code="PROFILE_MEDIA_NOT_FOUND",
                    detail="Média introuvable.",
                ) from exc
            # Ni la cle, ni les identifiants, ni l'URL ne doivent atterrir dans les logs.
            logger.warning("profile_media_r2_read_failed code=%s", code)
            raise AppError(
                status_code=502,
                code="PROFILE_MEDIA_UPSTREAM_ERROR",
                detail="Média temporairement indisponible.",
            ) from exc

        ext = key[key.rfind(".") :].lower()
        return ProfileMediaObject(
            body=response["Body"],
            content_type=response.get("ContentType") or CONTENT_TYPE_BY_EXT.get(ext, ""),
            content_length=response.get("ContentLength"),
        )

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
