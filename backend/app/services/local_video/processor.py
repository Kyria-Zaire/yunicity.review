"""FFmpeg/ffprobe processing for Local Video (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import uuid
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory

from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import EXTENSION_BY_LOCAL_VIDEO_MIME
from app.services.local_video.storage import LocalVideoStorage

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LocalVideoProcessResult:
    duration_seconds: float
    source_storage_key: str
    thumbnail_storage_key: str
    mime_type: str
    file_size_bytes: int


class LocalVideoMediaProcessor:
    def __init__(self, settings: Settings, storage: LocalVideoStorage) -> None:
        self._settings = settings
        self._storage = storage

    def process(
        self,
        *,
        source_storage_key: str,
        city_slug: str,
        video_id: uuid.UUID,
        content_type: str,
    ) -> LocalVideoProcessResult:
        if shutil.which("ffprobe") is None or shutil.which("ffmpeg") is None:
            raise AppError(
                status_code=503,
                code="LOCAL_VIDEO_PROCESSING_UNAVAILABLE",
                detail="Traitement vidéo indisponible sur ce serveur.",
            )

        ext = EXTENSION_BY_LOCAL_VIDEO_MIME.get(content_type, ".mp4")
        with TemporaryDirectory(prefix="yunicity-local-video-") as tmp:
            tmp_dir = Path(tmp)
            source_path = tmp_dir / f"source{ext}"
            self._storage.read_to_path(source_storage_key, source_path)

            duration = self._probe_duration(source_path)
            max_duration = float(self._settings.local_video_max_duration_seconds)
            if duration > max_duration + 0.5:
                raise AppError(
                    status_code=400,
                    code="LOCAL_VIDEO_TOO_LONG",
                    detail=f"Vidéo trop longue (max. {int(max_duration)} s).",
                )

            output_path = tmp_dir / "output.mp4"
            self._maybe_transcode(source_path, output_path, content_type)

            thumb_path = tmp_dir / "thumb.jpg"
            thumb_source = output_path if output_path.is_file() else source_path
            self._extract_thumbnail(thumb_source, thumb_path)

            final_source_key = self._storage.build_processed_key(
                city_slug=city_slug,
                video_id=video_id,
            )
            thumb_key = self._storage.build_thumbnail_key(
                city_slug=city_slug,
                video_id=video_id,
            )

            upload_source = output_path if output_path.is_file() else source_path
            self._storage.upload_file(upload_source, final_source_key, "video/mp4")
            self._storage.upload_file(thumb_path, thumb_key, "image/jpeg")

            return LocalVideoProcessResult(
                duration_seconds=duration,
                source_storage_key=final_source_key,
                thumbnail_storage_key=thumb_key,
                mime_type="video/mp4",
                file_size_bytes=upload_source.stat().st_size,
            )

    def build_result_from_existing_derivatives(
        self,
        *,
        city_slug: str,
        video_id: uuid.UUID,
    ) -> LocalVideoProcessResult | None:
        """Return result when processed.mp4 + thumbnail.jpg already exist (idempotent retry)."""
        processed_key = self._storage.build_processed_key(
            city_slug=city_slug,
            video_id=video_id,
        )
        thumb_key = self._storage.build_thumbnail_key(
            city_slug=city_slug,
            video_id=video_id,
        )
        processed_head = self._storage.head_object(processed_key)
        thumb_head = self._storage.head_object(thumb_key)
        if processed_head is None or thumb_head is None:
            return None
        if processed_head.content_length <= 0 or thumb_head.content_length <= 0:
            return None

        with TemporaryDirectory(prefix="yunicity-local-video-idem-") as tmp:
            processed_path = Path(tmp) / "processed.mp4"
            self._storage.read_to_path(processed_key, processed_path)
            try:
                duration = self._probe_duration(processed_path)
            except AppError:
                logger.warning(
                    "local_video_idempotent_probe_failed",
                    extra={"video_id": str(video_id), "processed_key": processed_key},
                )
                return None

        return LocalVideoProcessResult(
            duration_seconds=duration,
            source_storage_key=processed_key,
            thumbnail_storage_key=thumb_key,
            mime_type="video/mp4",
            file_size_bytes=processed_head.content_length,
        )

    def _probe_duration(self, path: Path) -> float:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ]
        try:
            completed = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except subprocess.CalledProcessError as exc:
            logger.warning("ffprobe_failed", extra={"stderr": exc.stderr})
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_INVALID_MEDIA",
                detail="Fichier vidéo illisible.",
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise AppError(
                status_code=504,
                code="LOCAL_VIDEO_PROCESSING_TIMEOUT",
                detail="Analyse vidéo expirée.",
            ) from exc

        payload = json.loads(completed.stdout or "{}")
        raw = payload.get("format", {}).get("duration")
        try:
            duration = float(raw)
        except (TypeError, ValueError) as exc:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_INVALID_MEDIA",
                detail="Durée vidéo introuvable.",
            ) from exc
        if duration <= 0:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_INVALID_MEDIA",
                detail="Durée vidéo invalide.",
            )
        return duration

    def _maybe_transcode(self, source: Path, output: Path, content_type: str) -> None:
        if content_type == "video/mp4" and source.suffix.lower() == ".mp4":
            return
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(source),
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            "-vf",
            "scale='min(1080,iw)':-2",
            str(output),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=120)
        except subprocess.CalledProcessError as exc:
            logger.warning("ffmpeg_transcode_failed", extra={"stderr": exc.stderr})
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_TRANSCODE_FAILED",
                detail="Impossible de préparer la vidéo.",
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise AppError(
                status_code=504,
                code="LOCAL_VIDEO_PROCESSING_TIMEOUT",
                detail="Transcodage vidéo expiré.",
            ) from exc

    def _extract_thumbnail(self, video_path: Path, thumb_path: Path) -> None:
        cmd = [
            "ffmpeg",
            "-y",
            "-ss",
            "00:00:01.000",
            "-i",
            str(video_path),
            "-vframes",
            "1",
            "-q:v",
            "2",
            "-vf",
            "scale=720:-2",
            str(thumb_path),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=60)
        except subprocess.CalledProcessError as exc:
            logger.warning("ffmpeg_thumb_failed", extra={"stderr": exc.stderr})
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_THUMBNAIL_FAILED",
                detail="Impossible de générer la miniature.",
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise AppError(
                status_code=504,
                code="LOCAL_VIDEO_PROCESSING_TIMEOUT",
                detail="Génération miniature expirée.",
            ) from exc
