"""Profile media storage policy — R2 required (PILOT-FIX-02)."""

from __future__ import annotations

from app.core.config import Settings
from app.core.errors import AppError


def validate_profile_media_storage_config(settings: Settings) -> list[str]:
    """Return non-fatal warnings; raise AppError when profile uploads cannot run."""
    warnings: list[str] = []
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
        if settings.app_env in {"recette", "preprod", "prod"}:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_R2_MISCONFIGURED",
                detail=(
                    "Upload avatar/couverture requiert R2. "
                    f"Variables manquantes : {', '.join(missing)}."
                ),
            )
        warnings.append(
            "Profile media R2 non configuré — upload avatar/couverture indisponible en dev."
        )
        return warnings

    cdn = (settings.local_video_cdn_base_url or "").strip()
    if settings.app_env in {"recette", "preprod", "prod"} and not cdn:
        raise AppError(
            status_code=500,
            code="PROFILE_MEDIA_CDN_MISCONFIGURED",
            detail=(
                "LOCAL_VIDEO_CDN_BASE_URL requis pour servir les photos profil "
                f"via media.* en {settings.app_env}."
            ),
        )

    if settings.app_env in {"preprod", "prod"} and cdn:
        lowered = cdn.lower()
        if "localhost" in lowered or "127.0.0.1" in lowered:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_CDN_MISCONFIGURED",
                detail="LOCAL_VIDEO_CDN_BASE_URL ne doit pas pointer vers localhost.",
            )

    return warnings
