"""Lightweight short-TTL JSON cache for read-only admin summaries (ADMIN-PERF-02A).

Best-effort cache backed by the shared Redis client. It is deliberately defensive:
any Redis error, decode error, or missing client degrades gracefully to a cache
miss so callers always fall back to a fresh database computation.

Only non-sensitive, read-only aggregates (cockpit / analytics / activity /
partners workspace summaries) are cached here. Never cache mutations, auth, or
RBAC decisions.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable
from typing import Any

from pydantic import BaseModel

from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)

# Short TTLs: enough to absorb dashboard reload bursts without showing stale data.
COCKPIT_SUMMARY_TTL_SECONDS = 45
ANALYTICS_SUMMARY_TTL_SECONDS = 45
ACTIVITY_SUMMARY_TTL_SECONDS = 30
PARTNERS_WORKSPACE_SUMMARY_TTL_SECONDS = 45


async def _maybe_await(value: Any) -> Any:
    if isinstance(value, Awaitable):
        return await value
    return value


async def get_cached_model[T: BaseModel](key: str, model: type[T]) -> T | None:
    """Return a cached model instance, or ``None`` on any miss/error."""
    client = get_redis_client()
    if client is None:
        return None
    try:
        raw = await _maybe_await(client.get(key))
    except Exception:  # noqa: BLE001 - cache must never break the request
        logger.warning("admin cache get failed for key=%s", key, exc_info=True)
        return None
    if not raw:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    try:
        return model.model_validate_json(raw)
    except Exception:  # noqa: BLE001 - tolerate schema drift / corrupt payloads
        logger.warning("admin cache decode failed for key=%s", key, exc_info=True)
        return None


async def set_cached_model(key: str, value: BaseModel, ttl_seconds: int) -> None:
    """Store a model instance with a TTL. Best-effort; failures are swallowed."""
    client = get_redis_client()
    if client is None:
        return
    try:
        await _maybe_await(client.set(key, value.model_dump_json(), ex=ttl_seconds))
    except Exception:  # noqa: BLE001 - cache must never break the request
        logger.warning("admin cache set failed for key=%s", key, exc_info=True)
