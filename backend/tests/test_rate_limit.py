"""Rate limiter behaviour, focused on the fail-closed-on-Redis-outage fix."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from app.core.errors import AppError
from app.core.rate_limit import RATE_LIMIT_BACKEND_UNAVAILABLE, enforce_rate_limit


class _FakeRedis:
    def __init__(self, *, incr_return: int = 1, incr_exc: Exception | None = None) -> None:
        self._incr_return = incr_return
        self._incr_exc = incr_exc
        self.expire = AsyncMock()

    async def incr(self, key: str) -> int:
        if self._incr_exc is not None:
            raise self._incr_exc
        return self._incr_return


def _patch_client(client: object) -> Any:
    return patch("app.core.rate_limit.get_redis_client", return_value=client)


async def test_redis_outage_fails_closed_by_default() -> None:
    """Security regression guard: Redis down MUST refuse, never silently allow."""
    with _patch_client(_FakeRedis(incr_exc=ConnectionError("redis down"))):
        with pytest.raises(AppError) as exc:
            await enforce_rate_limit("rl:login:ip:1.2.3.4", limit=5, window_seconds=900)
    assert exc.value.status_code == 503
    assert exc.value.code == RATE_LIMIT_BACKEND_UNAVAILABLE


async def test_redis_outage_logs_identifiable_error(caplog: pytest.LogCaptureFixture) -> None:
    with _patch_client(_FakeRedis(incr_exc=ConnectionError("redis down"))):
        with caplog.at_level("ERROR"), pytest.raises(AppError):
            await enforce_rate_limit("rl:key", limit=5, window_seconds=60)
    assert any("rate_limit_backend_unavailable" in r.getMessage() for r in caplog.records)


async def test_redis_outage_fail_open_only_when_explicitly_opted_in() -> None:
    with _patch_client(_FakeRedis(incr_exc=ConnectionError("redis down"))):
        # Must NOT raise — low-risk endpoint explicitly opted into fail-open.
        await enforce_rate_limit("rl:key", limit=5, window_seconds=60, fail_open=True)


async def test_redis_not_configured_is_noop() -> None:
    """Redis absent (dev/test) is a config no-op, not an outage — must not raise."""
    with _patch_client(None):
        await enforce_rate_limit("rl:key", limit=5, window_seconds=60)


async def test_under_limit_passes_unchanged() -> None:
    with _patch_client(_FakeRedis(incr_return=1)):
        await enforce_rate_limit("rl:key", limit=5, window_seconds=60)


async def test_over_limit_still_raises_429_unchanged() -> None:
    with _patch_client(_FakeRedis(incr_return=6)):
        with pytest.raises(AppError) as exc:
            await enforce_rate_limit("rl:key", limit=5, window_seconds=60)
    assert exc.value.status_code == 429
    assert exc.value.code == "RATE_LIMITED"
