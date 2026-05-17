import logging
from collections.abc import Awaitable
from typing import TYPE_CHECKING, Literal

from app.core.config import Settings, get_settings

CheckStatus = Literal["ok", "disabled", "error"]

if TYPE_CHECKING:
    from redis.asyncio import Redis

logger = logging.getLogger(__name__)

_redis_client: "Redis | None" = None


async def init_redis(settings: Settings | None = None) -> None:
    global _redis_client
    settings = settings or get_settings()
    if not settings.redis_url:
        _redis_client = None
        return
    from redis.asyncio import Redis

    _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
    _redis_client = None


async def check_redis() -> CheckStatus:
    settings = get_settings()
    if not settings.redis_url:
        return "disabled"
    if _redis_client is None:
        return "disabled"
    try:
        ping_result = _redis_client.ping()
        if isinstance(ping_result, Awaitable):
            pong = await ping_result
        else:
            pong = ping_result
        return "ok" if pong else "error"
    except Exception:
        logger.exception("Redis readiness check failed")
        return "error"
