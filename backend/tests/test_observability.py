"""OBS-01: Sentry gating (no-op without DSN) + structured-log correlation, no PII."""

from __future__ import annotations

import json
import logging
from collections.abc import MutableMapping
from typing import Any

from app.core.config import Settings
from app.core.observability import (
    ContextFilter,
    JsonLogFormatter,
    RequestContextMiddleware,
    bind_request_id,
    bind_user_id,
    init_sentry,
    request_id_var,
    user_id_var,
)


def _settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "JWT_SECRET_KEY": "x" * 48,
        "REFRESH_TOKEN_PEPPER": "y" * 32,
        "APP_ENV": "dev",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)


def test_sentry_is_noop_without_dsn() -> None:
    assert init_sentry(_settings(SENTRY_DSN=None)) is False
    assert init_sentry(_settings(SENTRY_DSN="   ")) is False


def test_context_filter_injects_request_and_user_ids() -> None:
    bind_request_id("req-abc")
    bind_user_id("11111111-1111-4111-8111-111111111111")
    try:
        record = logging.LogRecord("n", logging.INFO, __file__, 1, "hello", None, None)
        assert ContextFilter().filter(record) is True
        assert getattr(record, "request_id") == "req-abc"  # noqa: B009 (dynamic attr)
        assert getattr(record, "user_id") == "11111111-1111-4111-8111-111111111111"  # noqa: B009
    finally:
        request_id_var.set(None)
        user_id_var.set(None)


def test_context_filter_defaults_to_dash_when_unset() -> None:
    request_id_var.set(None)
    user_id_var.set(None)
    record = logging.LogRecord("n", logging.INFO, __file__, 1, "x", None, None)
    ContextFilter().filter(record)
    assert getattr(record, "request_id") == "-"  # noqa: B009 (dynamic attr)
    assert getattr(record, "user_id") == "-"  # noqa: B009


def test_json_formatter_emits_valid_json_with_correlation_and_no_pii() -> None:
    bind_request_id("req-json")
    bind_user_id("22222222-2222-4222-8222-222222222222")
    try:
        record = logging.LogRecord("svc", logging.WARNING, __file__, 1, "boom %s", ("x",), None)
        ContextFilter().filter(record)
        parsed = json.loads(JsonLogFormatter().format(record))
        assert parsed["level"] == "WARNING"
        assert parsed["logger"] == "svc"
        assert parsed["msg"] == "boom x"
        assert parsed["request_id"] == "req-json"
        assert parsed["user_id"] == "22222222-2222-4222-8222-222222222222"
        # No PII leakage: only the whitelisted keys are emitted.
        assert set(parsed) == {"ts", "level", "logger", "msg", "request_id", "user_id"}
    finally:
        request_id_var.set(None)
        user_id_var.set(None)


async def _run_middleware(scope: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    captured: dict[str, Any] = {}

    async def dummy_app(s: Any, receive: Any, send: Any) -> None:
        captured["rid_during"] = request_id_var.get()
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok"})

    sent: list[dict[str, Any]] = []

    async def send(message: MutableMapping[str, Any]) -> None:
        sent.append(dict(message))

    async def receive() -> MutableMapping[str, Any]:
        return {"type": "http.request"}

    await RequestContextMiddleware(dummy_app)(scope, receive, send)
    return captured, sent


async def test_middleware_uses_incoming_request_id_and_echoes_header() -> None:
    captured, sent = await _run_middleware(
        {"type": "http", "headers": [(b"x-request-id", b"incoming-42")]}
    )
    assert captured["rid_during"] == "incoming-42"
    start = next(m for m in sent if m["type"] == "http.response.start")
    assert (b"x-request-id", b"incoming-42") in start["headers"]
    # Contextvars reset after the request.
    assert request_id_var.get() is None
    assert user_id_var.get() is None


async def test_middleware_generates_request_id_when_absent() -> None:
    captured, sent = await _run_middleware({"type": "http", "headers": []})
    rid = captured["rid_during"]
    assert rid and len(rid) == 32  # generated uuid4 hex
    start = next(m for m in sent if m["type"] == "http.response.start")
    assert (b"x-request-id", rid.encode()) in start["headers"]
