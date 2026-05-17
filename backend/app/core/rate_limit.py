"""Redis-backed rate limiting for auth endpoints (no-op if Redis disabled)."""

from __future__ import annotations

import logging

from app.core.errors import AppError
from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)


async def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    client = get_redis_client()
    if client is None:
        return

    try:
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window_seconds)
        if int(count) > limit:
            raise AppError(
                status_code=429,
                code="RATE_LIMITED",
                detail="Trop de tentatives. Réessayez plus tard.",
            )
    except AppError:
        raise
    except Exception:
        logger.exception("Rate limit check failed for key %s", key)
