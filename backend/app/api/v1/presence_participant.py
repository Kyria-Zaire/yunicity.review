"""Participant presence session route (PASSPORT-PRESENCE-01B, PRD § 6, ADR § 4 and § 6).

Only mounted when ``PRESENCE_VALIDATION_ENABLED`` is true at startup; the router-level
flag dependency is a second, runtime barrier evaluated before authentication.

Order: flag -> authentication -> per-user limit -> per-IP limit -> issuance. Both limits
are fail-closed: Redis unavailable -> 503 before any database write (CTO decision D2).
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import require_authenticated_user
from app.core.presence_constants import PRESENCE_IP_RATE_LIMIT_DOMAIN
from app.core.presence_feature import require_presence_validation_enabled
from app.core.rate_limit import enforce_rate_limit, rate_limit_identity
from app.db.session import get_db
from app.models.user import User
from app.schemas.presence_session import PresenceSessionResponse
from app.services.presence_session_service import (
    PresenceSessionLimitReached,
    PresenceSessionService,
)

router = APIRouter(
    prefix="/passport",
    tags=["presence"],
    dependencies=[Depends(require_presence_validation_enabled)],
)

_RATE_LIMIT_WINDOW_SECONDS = 3600
#: Credentials are returned once: no intermediary may keep a copy.
_NO_STORE_HEADERS = {"Cache-Control": "no-store", "Pragma": "no-cache"}


def _client_ip(request: Request) -> str:
    """Same derivation as the other routes. SECONDARY protection only (D3 of 01B): the
    first ``X-Forwarded-For`` entry is not proven trustworthy behind the Railway proxy
    (PROXY-TRUSTED-CLIENT-IP-01)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def presence_ip_rate_limit_identity(ip: str) -> str:
    """Per-IP counting identity: ``HMAC(RATE_LIMIT_KEY_PEPPER, "presence-ip:" + ip)``.

    The explicit domain keeps this digest apart from every other use of the rate-limit
    pepper (e-mail identities, other routes), even for a client-chosen
    ``X-Forwarded-For`` value. No clear IP reaches Redis (B9).
    """
    return rate_limit_identity(f"{PRESENCE_IP_RATE_LIMIT_DOMAIN}{ip}")


def _limit_reached_response(exc: PresenceSessionLimitReached) -> JSONResponse:
    body: dict[str, Any] = {"detail": exc.detail, "code": exc.code, "errors": []}
    return JSONResponse(
        status_code=exc.status_code,
        content=body,
        headers={**_NO_STORE_HEADERS, "Retry-After": str(exc.retry_after_seconds)},
    )


@router.post(
    "/me/presence-session",
    response_model=PresenceSessionResponse,
    status_code=201,
)
async def issue_presence_session(
    request: Request,
    response: Response,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PresenceSessionResponse | JSONResponse:
    settings = get_settings()
    await enforce_rate_limit(
        f"presence:session:user:{current_user.id}",
        limit=settings.presence_session_user_limit_per_hour,
        window_seconds=_RATE_LIMIT_WINDOW_SECONDS,
    )
    await enforce_rate_limit(
        f"presence:session:ip:{presence_ip_rate_limit_identity(_client_ip(request))}",
        limit=settings.presence_session_ip_limit_per_hour,
        window_seconds=_RATE_LIMIT_WINDOW_SECONDS,
    )
    response.headers.update(_NO_STORE_HEADERS)
    try:
        return await PresenceSessionService(session).issue(current_user)
    except PresenceSessionLimitReached as exc:
        return _limit_reached_response(exc)
