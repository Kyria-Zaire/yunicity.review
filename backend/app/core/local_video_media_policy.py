"""Local Video media policy — MIME, size, storage config (VIDEO-01)."""

from __future__ import annotations

from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    ALLOWED_LOCAL_VIDEO_CONTENT_TYPES,
    EXTENSION_BY_LOCAL_VIDEO_MIME,
    LOCAL_VIDEO_MAX_BYTES,
)
from app.core.media_magic_bytes import (
    ContentTypeMismatchError,
    assert_content_matches_declared_type,
)


def normalize_content_type(content_type: str) -> str:
    normalized = content_type.strip().lower()
    if normalized not in ALLOWED_LOCAL_VIDEO_CONTENT_TYPES:
        raise ValueError("Type de fichier vidéo non supporté.")
    return normalized


def extension_for_content_type(content_type: str) -> str:
    normalized = normalize_content_type(content_type)
    return EXTENSION_BY_LOCAL_VIDEO_MIME.get(normalized, ".mp4")


def validate_local_video_content_bytes(content_type: str, data: bytes) -> None:
    """Reject uploads whose binary content does not match the declared video MIME type."""
    try:
        assert_content_matches_declared_type(data, content_type)
    except ContentTypeMismatchError as exc:
        raise AppError(
            status_code=400,
            code="LOCAL_VIDEO_INVALID_CONTENT",
            detail=str(exc),
        ) from exc


def assert_file_size_within_limit(size_bytes: int, *, max_bytes: int | None = None) -> None:
    limit = max_bytes if max_bytes is not None else LOCAL_VIDEO_MAX_BYTES
    if size_bytes <= 0:
        raise ValueError("Taille de fichier invalide.")
    if size_bytes > limit:
        raise ValueError("Fichier trop volumineux.")


def validate_local_video_storage_config(settings: Settings) -> list[str]:
    """Return non-fatal warnings; raise AppError only when config is unusable at runtime."""
    warnings: list[str] = []

    if settings.local_video_storage_backend == "filesystem":
        if settings.app_env in {"preprod", "prod"}:
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_STORAGE_MISCONFIGURED",
                detail=(
                    "LOCAL_VIDEO_STORAGE_BACKEND=filesystem interdit en preprod/prod. "
                    "Utiliser r2."
                ),
            )
        if settings.app_env == "recette":
            warnings.append(
                "LOCAL_VIDEO_STORAGE_BACKEND=filesystem en recette — acceptable pour tests, "
                "pas pour charge vidéo."
            )
        return warnings

    if settings.local_video_storage_backend != "r2":
        raise AppError(
            status_code=500,
            code="LOCAL_VIDEO_STORAGE_MISCONFIGURED",
            detail="LOCAL_VIDEO_STORAGE_BACKEND doit être filesystem ou r2.",
        )

    missing: list[str] = []
    if not settings.local_video_r2_endpoint:
        missing.append("LOCAL_VIDEO_R2_ENDPOINT")
    if not settings.local_video_r2_bucket:
        missing.append("LOCAL_VIDEO_R2_BUCKET")
    if not settings.local_video_r2_access_key_id:
        missing.append("LOCAL_VIDEO_R2_ACCESS_KEY_ID")
    if not settings.local_video_r2_secret_access_key:
        missing.append("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY")
    if missing:
        raise AppError(
            status_code=500,
            code="LOCAL_VIDEO_R2_MISCONFIGURED",
            detail=f"Variables R2 manquantes : {', '.join(missing)}.",
        )

    cdn = (settings.local_video_cdn_base_url or "").strip()
    if settings.app_env in {"recette", "preprod", "prod"} and not cdn:
        raise AppError(
            status_code=500,
            code="LOCAL_VIDEO_CDN_MISCONFIGURED",
            detail=(
                "LOCAL_VIDEO_CDN_BASE_URL requis lorsque LOCAL_VIDEO_STORAGE_BACKEND=r2 "
                f"en {settings.app_env}."
            ),
        )

    if settings.app_env in {"preprod", "prod"} and cdn:
        lowered = cdn.lower()
        if "localhost" in lowered or "127.0.0.1" in lowered:
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_CDN_MISCONFIGURED",
                detail="LOCAL_VIDEO_CDN_BASE_URL ne doit pas pointer vers localhost.",
            )

    if settings.local_video_max_bytes <= 0:
        raise AppError(
            status_code=500,
            code="LOCAL_VIDEO_LIMITS_MISCONFIGURED",
            detail="LOCAL_VIDEO_MAX_BYTES doit être > 0.",
        )
    if settings.local_video_max_duration_seconds <= 0:
        raise AppError(
            status_code=500,
            code="LOCAL_VIDEO_LIMITS_MISCONFIGURED",
            detail="LOCAL_VIDEO_MAX_DURATION_SECONDS doit être > 0.",
        )

    return warnings
