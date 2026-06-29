"""Local Video processing job queue (VIDEO-03A / ARQ)."""

from __future__ import annotations

import logging
import uuid

from app.core.config import Settings, get_settings
from app.core.local_video_constants import LOCAL_VIDEO_PROCESSING_MAX_TRIES

logger = logging.getLogger(__name__)

ARQ_QUEUE_NAME = "yunicity-media-video"
PROCESS_LOCAL_VIDEO_JOB = "process_local_video_job"


async def enqueue_local_video_processing(
    video_id: uuid.UUID,
    *,
    settings: Settings | None = None,
) -> str:
    settings = settings or get_settings()
    if not settings.redis_url:
        raise RuntimeError("REDIS_URL required for async video processing")

    from arq import create_pool
    from arq.connections import RedisSettings

    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    job_id = f"local-video:{video_id}"
    try:
        job = await redis.enqueue_job(
            PROCESS_LOCAL_VIDEO_JOB,
            str(video_id),
            _job_id=job_id,
            _queue_name=ARQ_QUEUE_NAME,
        )
    finally:
        await redis.close()
    if job is None:
        logger.info(
            "local_video_job_deduplicated",
            extra={"video_id": str(video_id), "job_id": job_id},
        )
        return job_id

    logger.info(
        "local_video_job_enqueued",
        extra={"video_id": str(video_id), "job_id": job_id},
    )
    return job_id


def worker_max_tries() -> int:
    return LOCAL_VIDEO_PROCESSING_MAX_TRIES
