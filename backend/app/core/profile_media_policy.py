"""Profile media storage policy — filesystem en dev, R2 en recette+ (PILOT-FIX-02)."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from app.core.config import Settings
from app.core.errors import AppError
from app.core.media_root import CANONICAL_MEDIA_ROOT, managed_persistent_media_opt_in
from app.core.story_media_policy import (
    _CLOUD_ENVS,
    _QA_ROOTS,
    _is_relative_to,
    is_managed_cloud_runtime,
)


def default_profile_media_dev_dir() -> Path:
    """Cross-platform dev upload root (Windows-safe absolute path)."""
    if os.name == "nt":
        return Path(tempfile.gettempdir()) / "yunicity-qa" / "profile-media"
    return Path("/tmp/yunicity-qa/profile-media")


def allowed_profile_media_roots() -> tuple[Path, ...]:
    # Volume persistant declare : la racine canonique devient une destination
    # legitime, mais UNIQUEMENT sous opt-in explicite. Ouvrir la posture C3.1-R1D
    # ne veut pas dire autoriser un chemin quelconque sur un runtime manage.
    roots = list(_QA_ROOTS)
    roots.append(default_profile_media_dev_dir().parent)
    roots.append(Path(tempfile.gettempdir()))
    if os.environ.get("PYTEST_CURRENT_TEST"):
        roots.append(Path(tempfile.gettempdir()))
    # Preserve order, drop duplicates.
    if managed_persistent_media_opt_in():
        roots.append(Path(CANONICAL_MEDIA_ROOT))
    return tuple(dict.fromkeys(roots))


def resolve_profile_media_upload_dir(raw: str | None, *, app_env: str) -> Path:
    candidate_raw = raw
    if candidate_raw is None or not str(candidate_raw).strip():
        if os.environ.get("PYTEST_CURRENT_TEST"):
            candidate_raw = str(Path(tempfile.gettempdir()) / "yunicity-profile-media")
        elif app_env == "dev":
            candidate_raw = str(default_profile_media_dev_dir())
        else:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_FILESYSTEM_MISCONFIGURED",
                detail="PROFILE_MEDIA_UPLOAD_DIR est requis pour le backend filesystem.",
            )

    candidate = Path(str(candidate_raw).strip())
    if not candidate.is_absolute() or ".." in candidate.parts:
        raise AppError(
            status_code=500,
            code="PROFILE_MEDIA_FILESYSTEM_MISCONFIGURED",
            detail="PROFILE_MEDIA_UPLOAD_DIR doit être un chemin absolu contrôlé.",
        )
    resolved = candidate.resolve()
    if not any(_is_relative_to(resolved, root) for root in allowed_profile_media_roots()):
        raise AppError(
            status_code=500,
            code="PROFILE_MEDIA_FILESYSTEM_MISCONFIGURED",
            detail="PROFILE_MEDIA_UPLOAD_DIR n'est pas dans un répertoire autorisé.",
        )
    return resolved


def validate_profile_media_storage_config(settings: Settings) -> list[str]:
    """Return non-fatal warnings; raise AppError when profile uploads cannot run."""
    backend = settings.profile_media_storage_backend
    if backend == "filesystem":
        # Volume persistant declare et autorise : le disque local cesse d'etre ephemere,
        # donc le motif du blocage C3.1-R1D tombe. `resolve_*_upload_dir` continue de
        # verifier la racine, qui n'accepte /data/media que sous ce meme opt-in.
        persistent_volume = managed_persistent_media_opt_in()
        if (is_managed_cloud_runtime() or settings.app_env in _CLOUD_ENVS) and (
            not persistent_volume
        ):
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_FILESYSTEM_FORBIDDEN",
                detail=(
                    "PROFILE_MEDIA_STORAGE_BACKEND=filesystem interdit hors DEV/QA local. "
                    "Utiliser r2."
                ),
            )
        if settings.app_env != "dev" and not persistent_volume:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_FILESYSTEM_FORBIDDEN",
                detail="PROFILE_MEDIA_STORAGE_BACKEND=filesystem interdit dans cet environnement.",
            )
        resolve_profile_media_upload_dir(
            settings.profile_media_upload_dir,
            app_env=settings.app_env,
        )
        return []

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
        if settings.app_env in _CLOUD_ENVS:
            raise AppError(
                status_code=500,
                code="PROFILE_MEDIA_R2_MISCONFIGURED",
                detail=(
                    "Upload avatar/couverture requiert R2. "
                    f"Variables manquantes : {', '.join(missing)}."
                ),
            )
        warnings.append(
            "Profile media R2 non configuré — basculez "
            "PROFILE_MEDIA_STORAGE_BACKEND=filesystem en dev."
        )
        return warnings

    cdn = (settings.local_video_cdn_base_url or "").strip()
    if settings.app_env in _CLOUD_ENVS and not cdn:
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
