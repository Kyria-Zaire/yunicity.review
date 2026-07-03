"""Local Video ARQ retry policy (VIDEO-03B.2)."""

from __future__ import annotations

import random
from collections.abc import Callable

from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_PROCESSING_MAX_TRIES,
    LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES,
    LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS,
    LOCAL_VIDEO_PROCESSING_RETRY_JITTER_FRACTION,
    LOCAL_VIDEO_PROCESSING_RETRY_MAX_DEFER_SECONDS,
)

# --- Error classification (VIDEO-03B.2) ---
#
# Permanent (no ARQ retry) — handled in processing_service, video stays failed:
#   LOCAL_VIDEO_INVALID_MEDIA      — unreadable / invalid duration (ffprobe)
#   LOCAL_VIDEO_TOO_LONG           — exceeds max duration
#   LOCAL_VIDEO_TRANSCODE_FAILED   — ffmpeg transcode error (bad input)
#   LOCAL_VIDEO_THUMBNAIL_FAILED   — ffmpeg thumbnail error (bad input)
#   LOCAL_VIDEO_CITY_SLUG_MISMATCH — territory inconsistency
#
# Transient (ARQ retry with progressive backoff):
#   LOCAL_VIDEO_PROCESSING_UNAVAILABLE — ffmpeg/ffprobe missing (cold worker)
#   LOCAL_VIDEO_PROCESSING_TIMEOUT     — subprocess timeout (network/load spike)
#   LOCAL_VIDEO_STORAGE_UNAVAILABLE    — R2/storage transient outage
#   Any other AppError not in NON_RETRYABLE_CODES
#   Unexpected Exception (network, boto, OOM, etc.) — retried up to max_tries


def local_video_processing_max_tries() -> int:
    return LOCAL_VIDEO_PROCESSING_MAX_TRIES


def is_retryable_app_error(exc: AppError) -> bool:
    return exc.code not in LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES


def is_retryable_exception(exc: BaseException) -> bool:
    if isinstance(exc, AppError):
        return is_retryable_app_error(exc)
    return True


def compute_retry_defer_seconds(
    job_try: int,
    *,
    jitter_fraction: float = LOCAL_VIDEO_PROCESSING_RETRY_JITTER_FRACTION,
    rng: Callable[[], float] | None = None,
) -> float:
    """Defer duration after failed attempt ``job_try`` (1-based, before the next run).

    Uses ``LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS`` per attempt, plus
    multiplicative jitter in ``[0, base * jitter_fraction)`` to reduce thundering herd.
    """
    if job_try < 1:
        job_try = 1
    schedule = LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS
    index = min(job_try - 1, len(schedule) - 1)
    base = float(schedule[index])
    roll = rng() if rng is not None else random.random()
    jitter = roll * base * jitter_fraction
    return min(base + jitter, float(LOCAL_VIDEO_PROCESSING_RETRY_MAX_DEFER_SECONDS))


def retry_policy_summary() -> dict[str, object]:
    """Effective retry policy for startup / ops logs."""
    return {
        "strategy": "explicit_schedule_with_jitter",
        "max_tries": LOCAL_VIDEO_PROCESSING_MAX_TRIES,
        "backoff_seconds_by_failed_attempt": list(LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS),
        "jitter_fraction": LOCAL_VIDEO_PROCESSING_RETRY_JITTER_FRACTION,
        "max_defer_seconds": LOCAL_VIDEO_PROCESSING_RETRY_MAX_DEFER_SECONDS,
        "non_retryable_codes": sorted(LOCAL_VIDEO_PROCESSING_NON_RETRYABLE_CODES),
    }
