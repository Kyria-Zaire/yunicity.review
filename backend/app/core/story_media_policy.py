"""Story/post media storage policy — R2 in cloud, filesystem only when explicit (C3.1-R1D)."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from app.core.config import Settings
from app.core.errors import AppError
from app.core.media_root import CANONICAL_MEDIA_ROOT, managed_persistent_media_opt_in

_CLOUD_ENVS = frozenset({"recette", "preprod", "prod"})
_QA_ROOTS = (Path("/var/yunicity-qa"), Path("/tmp/yunicity-qa"))


def is_managed_cloud_runtime() -> bool:
    """Railway/production hosts must never use local disk, even if APP_ENV=dev."""
    return any(key.upper().startswith("RAILWAY") for key in os.environ)


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def allowed_story_media_roots() -> tuple[Path, ...]:
    # Volume persistant declare : la racine canonique devient une destination
    # legitime, mais UNIQUEMENT sous opt-in explicite. Ouvrir la posture C3.1-R1D
    # ne veut pas dire autoriser un chemin quelconque sur un runtime manage.
    roots = list(_QA_ROOTS)
    if os.environ.get("PYTEST_CURRENT_TEST"):
        roots.append(Path(tempfile.gettempdir()))
    if managed_persistent_media_opt_in():
        roots.append(Path(CANONICAL_MEDIA_ROOT))
    return tuple(roots)


def resolve_story_media_upload_dir(raw: str | None) -> Path:
    if raw is None or not str(raw).strip():
        raise AppError(
            status_code=500,
            code="STORY_MEDIA_FILESYSTEM_MISCONFIGURED",
            detail="STORY_MEDIA_UPLOAD_DIR est requis pour le backend filesystem.",
        )
    candidate = Path(str(raw).strip())
    if not candidate.is_absolute() or ".." in candidate.parts:
        raise AppError(
            status_code=500,
            code="STORY_MEDIA_FILESYSTEM_MISCONFIGURED",
            detail="STORY_MEDIA_UPLOAD_DIR doit être un chemin absolu contrôlé.",
        )
    resolved = candidate.resolve()
    if not any(_is_relative_to(resolved, root) for root in allowed_story_media_roots()):
        raise AppError(
            status_code=500,
            code="STORY_MEDIA_FILESYSTEM_MISCONFIGURED",
            detail="STORY_MEDIA_UPLOAD_DIR n'est pas dans un répertoire autorisé.",
        )
    return resolved


def validate_story_media_storage_config(settings: Settings) -> list[str]:
    """Return non-fatal warnings; raise AppError when uploads cannot run."""
    backend = settings.story_media_storage_backend
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
                code="STORY_MEDIA_FILESYSTEM_FORBIDDEN",
                detail=(
                    "STORY_MEDIA_STORAGE_BACKEND=filesystem interdit hors DEV/QA local. "
                    "Utiliser r2."
                ),
            )
        if settings.app_env != "dev" and not persistent_volume:
            raise AppError(
                status_code=500,
                code="STORY_MEDIA_FILESYSTEM_FORBIDDEN",
                detail="STORY_MEDIA_STORAGE_BACKEND=filesystem interdit dans cet environnement.",
            )
        resolve_story_media_upload_dir(settings.story_media_upload_dir)
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
                code="STORY_MEDIA_R2_MISCONFIGURED",
                detail=(
                    "Upload story requiert R2. "
                    f"Variables manquantes : {', '.join(missing)}."
                ),
            )
        warnings.append(
            "Story media R2 non configuré — upload story indisponible en dev."
        )
        return warnings

    cdn = (settings.local_video_cdn_base_url or "").strip()
    if settings.app_env in _CLOUD_ENVS and not cdn:
        raise AppError(
            status_code=500,
            code="STORY_MEDIA_CDN_MISCONFIGURED",
            detail=(
                "LOCAL_VIDEO_CDN_BASE_URL requis pour servir les médias story "
                f"via media.* en {settings.app_env}."
            ),
        )

    if settings.app_env in {"preprod", "prod"} and cdn:
        lowered = cdn.lower()
        if "localhost" in lowered or "127.0.0.1" in lowered:
            raise AppError(
                status_code=500,
                code="STORY_MEDIA_CDN_MISCONFIGURED",
                detail="LOCAL_VIDEO_CDN_BASE_URL ne doit pas pointer vers localhost.",
            )

    return warnings
