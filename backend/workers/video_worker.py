"""ARQ worker for Local Video media processing (VIDEO-03A)."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS,
    LOCAL_VIDEO_PROCESSING_MAX_TRIES,
    LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS,
)
from app.db.session import init_db
from app.integrations.redis import close_redis, init_redis
from app.services.local_video.job_queue import ARQ_QUEUE_NAME
from app.services.local_video.processing_service import (
    mark_local_video_processing_exhausted,
    run_local_video_processing,
)
from arq.connections import RedisSettings

logger = logging.getLogger(__name__)


async def startup(ctx: dict[str, Any]) -> None:
    del ctx
    settings = get_settings()
    init_db(settings)
    await init_redis(settings)
    logger.info(
        "video_worker_startup",
        extra={
            "queue": ARQ_QUEUE_NAME,
            "job_timeout_seconds": _job_timeout_seconds(),
            "max_tries": LOCAL_VIDEO_PROCESSING_MAX_TRIES,
            "retry_backoff_seconds": LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS,
        },
    )


async def shutdown(ctx: dict[str, Any]) -> None:
    del ctx
    await close_redis()


async def process_local_video_job(ctx: dict[str, Any], video_id: str) -> None:
    job_try = int(ctx.get("job_try", 1))
    try:
        await run_local_video_processing(uuid.UUID(video_id), job_try=job_try)
    except AppError:
        raise
    except Exception as exc:
        logger.exception(
            "local_video_job_failed",
            extra={"video_id": video_id, "job_try": job_try},
        )
        raise exc


def _job_timeout_seconds() -> int:
    return get_settings().local_video_processing_job_timeout_seconds


def _failure_is_timeout(ctx: dict[str, Any]) -> bool:
    result = ctx.get("result")
    if isinstance(result, (asyncio.TimeoutError, TimeoutError)):
        return True
    if isinstance(result, str) and "timeout" in result.lower():
        return True
    if isinstance(result, Exception) and "timeout" in str(result).lower():
        return True
    return False


async def on_job_failure(ctx: dict[str, Any]) -> None:
    args = ctx.get("args") or ()
    if not args:
        return
    video_id = str(args[0])
    job_try = int(ctx.get("job_try", 1))
    timed_out = _failure_is_timeout(ctx)
    logger.error(
        "local_video_job_exhausted",
        extra={
            "video_id": video_id,
            "job_try": job_try,
            "timed_out": timed_out,
            "job_timeout_seconds": _job_timeout_seconds(),
        },
    )
    error_message = (
        "Timeout du traitement vidéo (worker ARQ). Augmenter "
        "LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS si nécessaire."
        if timed_out
        else "Échec du traitement vidéo après plusieurs tentatives."
    )
    await mark_local_video_processing_exhausted(uuid.UUID(video_id), error_message=error_message)


def _redis_settings() -> RedisSettings:
    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError("REDIS_URL is required for the video worker")
    return RedisSettings.from_dsn(settings.redis_url)


class WorkerSettings:
    functions = [process_local_video_job]
    on_startup = startup
    on_shutdown = shutdown
    on_job_failure = on_job_failure
    queue_name = ARQ_QUEUE_NAME
    job_timeout = LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS
    max_tries = LOCAL_VIDEO_PROCESSING_MAX_TRIES
    retry_jobs = True
    # ARQ defer between retries: (try-1)^2 * retry_delay, capped at 86400 s.
    retry_delay = LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS[0]
    redis_settings = _redis_settings()

    @classmethod
    def adjust_for_settings(cls) -> None:
        cls.job_timeout = _job_timeout_seconds()


WorkerSettings.adjust_for_settings()
