"""Local Video async processing (VIDEO-03A)."""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES,
    LocalVideoStatus,
    LocalVideoUploadStatus,
)
from app.db.session import get_session_factory, init_db
from app.models.local_video import LocalVideo, LocalVideoUpload
from app.services.local_video.processor import LocalVideoMediaProcessor, LocalVideoProcessResult
from app.services.local_video.storage import build_local_video_storage
from app.services.local_video.storage_keys import city_slug_from_storage_key

logger = logging.getLogger(__name__)


def _apply_process_result(
    video: LocalVideo,
    settings: Settings,
    result: LocalVideoProcessResult,
) -> None:
    storage = build_local_video_storage(settings)
    video.storage_key = result.source_storage_key
    video.media_url = storage.public_url(result.source_storage_key)
    video.thumbnail_url = storage.public_url(result.thumbnail_storage_key)
    video.duration_seconds = result.duration_seconds
    video.file_size_bytes = result.file_size_bytes
    video.mime_type = result.mime_type
    video.processing_error = None


async def _mark_failed(
    session: AsyncSession,
    *,
    video: LocalVideo,
    upload: LocalVideoUpload | None,
    error_message: str,
) -> None:
    video.status = LocalVideoStatus.FAILED.value
    video.processing_error = error_message
    if upload is not None:
        upload.status = LocalVideoUploadStatus.FAILED.value
    await session.commit()


async def mark_local_video_processing_exhausted(
    video_id: uuid.UUID,
    *,
    error_message: str = "Échec du traitement vidéo après plusieurs tentatives.",
    settings: Settings | None = None,
) -> None:
    """Mark video FAILED when ARQ retries are exhausted."""
    settings = settings or get_settings()
    session_factory = get_session_factory()
    if session_factory is None:
        init_db(settings)
        session_factory = get_session_factory()
    if session_factory is None:
        return

    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        if video is None or video.status != LocalVideoStatus.PROCESSING.value:
            return
        upload = await session.get(LocalVideoUpload, video.upload_id)
        await _mark_failed(
            session,
            video=video,
            upload=upload,
            error_message=error_message,
        )


async def _finalize_ready(
    session: AsyncSession,
    *,
    video: LocalVideo,
    upload: LocalVideoUpload | None,
    settings: Settings,
    result: LocalVideoProcessResult,
    video_id: uuid.UUID,
    job_try: int,
    started: float,
    source_bytes: int,
    idempotent: bool,
) -> None:
    _apply_process_result(video, settings, result)
    video.status = LocalVideoStatus.PUBLISHED.value
    video.published_at = datetime.now(tz=UTC)
    if upload is not None:
        upload.status = LocalVideoUploadStatus.CONSUMED.value
    await session.commit()

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    log_event = (
        "local_video_processing_ready_idempotent"
        if idempotent
        else "local_video_processing_ready"
    )
    logger.info(
        log_event,
        extra={
            "video_id": str(video_id),
            "job_try": job_try,
            "duration_seconds": result.duration_seconds,
            "source_bytes": source_bytes,
            "output_bytes": result.file_size_bytes,
            "elapsed_ms": elapsed_ms,
            "idempotent": idempotent,
        },
    )


async def run_local_video_processing(
    video_id: uuid.UUID,
    *,
    job_try: int = 1,
    settings: Settings | None = None,
) -> None:
    """Execute FFmpeg pipeline for one video (worker entrypoint)."""
    settings = settings or get_settings()
    session_factory = get_session_factory()
    if session_factory is None:
        init_db(settings)
        session_factory = get_session_factory()
    if session_factory is None:
        raise RuntimeError("Database is not configured")

    started = time.perf_counter()
    async with session_factory() as session:
        video = await session.get(LocalVideo, video_id)
        if video is None:
            logger.error(
                "local_video_processing_missing",
                extra={"video_id": str(video_id), "job_try": job_try},
            )
            return

        if video.status == LocalVideoStatus.PUBLISHED.value:
            logger.info(
                "local_video_processing_skip_ready",
                extra={"video_id": str(video_id), "job_try": job_try},
            )
            return

        upload = await session.get(LocalVideoUpload, video.upload_id)
        city_slug = city_slug_from_storage_key(video.storage_key)
        if city_slug is None:
            await _mark_failed(
                session,
                video=video,
                upload=upload,
                error_message="Slug de ville introuvable pour la vidéo.",
            )
            return

        source_bytes = video.file_size_bytes
        storage = build_local_video_storage(settings)
        processor = LocalVideoMediaProcessor(settings, storage)

        logger.info(
            "local_video_processing_start",
            extra={
                "video_id": str(video_id),
                "job_try": job_try,
                "source_bytes": source_bytes,
                "city_slug": city_slug,
            },
        )

        existing = await asyncio.to_thread(
            processor.build_result_from_existing_derivatives,
            city_slug=city_slug,
            video_id=video_id,
        )
        if existing is not None:
            await _finalize_ready(
                session,
                video=video,
                upload=upload,
                settings=settings,
                result=existing,
                video_id=video_id,
                job_try=job_try,
                started=started,
                source_bytes=source_bytes,
                idempotent=True,
            )
            return

        try:
            result = await asyncio.to_thread(
                processor.process,
                source_storage_key=video.storage_key,
                city_slug=city_slug,
                video_id=video_id,
                content_type=video.mime_type,
            )
        except AppError as exc:
            retryable = exc.code not in LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES
            logger.warning(
                "local_video_processing_failed",
                extra={
                    "video_id": str(video_id),
                    "job_try": job_try,
                    "error_code": exc.code,
                    "retryable": retryable,
                },
            )
            if not retryable:
                await _mark_failed(session, video=video, upload=upload, error_message=exc.detail)
                return
            raise
        except Exception:
            logger.exception(
                "local_video_processing_unexpected_error",
                extra={"video_id": str(video_id), "job_try": job_try},
            )
            raise

        await _finalize_ready(
            session,
            video=video,
            upload=upload,
            settings=settings,
            result=result,
            video_id=video_id,
            job_try=job_try,
            started=started,
            source_bytes=source_bytes,
            idempotent=False,
        )
