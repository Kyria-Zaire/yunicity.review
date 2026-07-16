"""Observability (OBS-01): Sentry error capture + structured-log correlation.

- Sentry is gated on `SENTRY_DSN`: no DSN → no-op (dev/CI/prod-without-DSN), exactly
  like the Redis/R2 pattern. `send_default_pii=False` — no PII is ever sent.
- `request_id` and `user_id` are carried in contextvars, injected into every log record
  (and the Sentry scope). `user_id` is the UUID only — never the email or any PII.

The request-context middleware is a pure ASGI middleware (not BaseHTTPMiddleware) so the
contextvars it sets propagate into the endpoint and its dependencies within the same task.
"""

from __future__ import annotations

import json
import logging
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, MutableMapping

    from app.core.config import Settings

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)
user_id_var: ContextVar[str | None] = ContextVar("user_id", default=None)

_sentry_enabled = False


def _sentry_active() -> bool:
    return _sentry_enabled


def bind_request_id(request_id: str | None) -> None:
    request_id_var.set(request_id)
    if _sentry_active():
        try:
            import sentry_sdk

            sentry_sdk.set_tag("request_id", request_id)
        except Exception:  # never let observability break a request
            logging.getLogger(__name__).debug("sentry set_tag failed", exc_info=True)


def bind_user_id(user_id: str | None) -> None:
    """Bind the authenticated user's UUID (never email/PII) to logs and Sentry."""
    user_id_var.set(user_id)
    if _sentry_active():
        try:
            import sentry_sdk

            sentry_sdk.set_user({"id": user_id} if user_id else None)
        except Exception:
            logging.getLogger(__name__).debug("sentry set_user failed", exc_info=True)


def init_sentry(settings: Settings) -> bool:
    """Initialise Sentry iff SENTRY_DSN is set. Returns True if enabled. No-op otherwise."""
    global _sentry_enabled
    dsn = (settings.sentry_dsn or "").strip()
    if not dsn:
        _sentry_enabled = False
        return False
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=dsn,
        environment=settings.app_env,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,  # never attach request bodies / headers / user PII
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )
    _sentry_enabled = True
    return True


class ContextFilter(logging.Filter):
    """Inject request_id / user_id onto every LogRecord (default '-' when unset)."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get() or "-"
        record.user_id = user_id_var.get() or "-"
        return True


class JsonLogFormatter(logging.Formatter):
    """One JSON object per line — request_id/user_id included, no PII beyond the message."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
            "user_id": getattr(record, "user_id", "-"),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


class RequestContextMiddleware:
    """Pure ASGI middleware: per-request request_id (from X-Request-ID or generated),
    echoed back in the response header, and reset of user_id (set later by auth deps)."""

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(
        self,
        scope: MutableMapping[str, Any],
        receive: Callable[[], Awaitable[MutableMapping[str, Any]]],
        send: Callable[[MutableMapping[str, Any]], Awaitable[None]],
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        incoming = headers.get(b"x-request-id", b"").decode(errors="ignore").strip()
        request_id = incoming or uuid4().hex

        token_r = request_id_var.set(request_id)
        token_u = user_id_var.set(None)
        bind_request_id(request_id)

        async def send_wrapper(message: MutableMapping[str, Any]) -> None:
            if message["type"] == "http.response.start":
                raw_headers = list(message.get("headers") or [])
                raw_headers.append((b"x-request-id", request_id.encode()))
                message["headers"] = raw_headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            request_id_var.reset(token_r)
            user_id_var.reset(token_u)
