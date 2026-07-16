"""Redis-backed rate limiting.

Fail-CLOSED by default: if Redis is configured but unreachable or errors at runtime,
the request is REFUSED (503) instead of being silently allowed. A Redis outage must
not disable anti-abuse protection (login brute-force, spam, upload flooding).

Endpoints that are genuinely low-risk may opt into fail-open explicitly with
`fail_open=True`, documented at the call site. Default is fail-closed everywhere.

Distinct case: when Redis is not configured at all (`get_redis_client()` returns None,
e.g. dev/test without Redis), rate limiting is simply OFF by configuration — a
deliberate no-op, not a runtime failure — so we do not raise there.
"""

from __future__ import annotations

import logging

from app.core.errors import AppError
from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)

RATE_LIMIT_BACKEND_UNAVAILABLE = "RATE_LIMIT_BACKEND_UNAVAILABLE"


async def enforce_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
    *,
    fail_open: bool = False,
) -> None:
    client = get_redis_client()
    if client is None:
        # Redis not configured (dev/test): rate limiting off by configuration, not a
        # failure. Do NOT fail closed here or every endpoint would 503 without Redis.
        return

    try:
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window_seconds)
    except Exception:
        # Redis is configured but unreachable/erroring. Stable, greppable event name so
        # a future monitoring/alerting layer (e.g. Sentry) can hook onto it.
        logger.error(
            "rate_limit_backend_unavailable key=%s fail_open=%s",
            key,
            fail_open,
            exc_info=True,
        )
        if fail_open:
            return
        raise AppError(
            status_code=503,
            code=RATE_LIMIT_BACKEND_UNAVAILABLE,
            detail="Service momentanément indisponible. Réessayez dans un instant.",
        ) from None

    if int(count) > limit:
        raise AppError(
            status_code=429,
            code="RATE_LIMITED",
            detail="Trop de tentatives. Réessayez plus tard.",
        )
