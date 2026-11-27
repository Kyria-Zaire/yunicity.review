"""Issuance of ephemeral presence sessions (PASSPORT-PRESENCE-01B, ADR § 4 and § 6).

One transaction per issuance, in this order:

1. lock the user's active Passport row (``FOR UPDATE``), which also re-checks its state;
2. purge this Passport's expired sessions;
3. count live sessions (``consumed_at IS NULL AND expires_at > clock_timestamp()``) and
   refuse beyond the cap, with the delay before the first expiry (CTO decision D1);
4. insert the new session (``expires_at = clock_timestamp() + 60 s``) inside a savepoint,
   drawing again on a digest collision (probability roughly ``N / 2**40`` for the code,
   ``N`` being the number of stored code digests), three draws at most;
5. commit.

Any failure rolls the whole transaction back: no partial row. A live session is never
invalidated. Clear credentials only leave through the returned response.
"""

from __future__ import annotations

import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.presence_constants import (
    PRESENCE_MAX_LIVE_SESSIONS_PER_PASSPORT,
    PRESENCE_SESSION_ISSUE_MAX_ATTEMPTS,
    PRESENCE_SESSION_REFRESH_AFTER_SECONDS,
)
from app.core.presence_credentials import issue_credentials
from app.models.user import User
from app.repositories.presence_session_repository import (
    PresenceSessionRepository,
    is_digest_collision,
)
from app.schemas.presence_session import PresenceSessionResponse

logger = logging.getLogger(__name__)

PRESENCE_SESSION_LIMIT_REACHED = "PRESENCE_SESSION_LIMIT_REACHED"
PRESENCE_SESSION_UNAVAILABLE = "PRESENCE_SESSION_UNAVAILABLE"


class PresenceSessionLimitReached(AppError):
    """429 carrying the delay before a slot frees up (``Retry-After``).

    The route turns ``retry_after_seconds`` into the header. Neither the message nor the
    metadata contains a token, a code or a digest.
    """

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(
            status_code=429,
            code=PRESENCE_SESSION_LIMIT_REACHED,
            detail="Trop de QR de présence actifs. Réessayez dans un instant.",
        )
        self.retry_after_seconds = retry_after_seconds


class PresenceSessionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = PresenceSessionRepository(session)

    async def issue(self, user: User) -> PresenceSessionResponse:
        pepper = get_settings().presence_token_pepper
        # Read once: ``user`` is expired by commit or rollback, and an async lazy load of
        # an expired attribute would fail.
        user_id = user.id
        try:
            passport_id = await self._repo.lock_active_passport(user_id)
            if passport_id is None:
                if await self._repo.user_has_passport(user_id):
                    raise AppError(
                        status_code=403,
                        code="PASSPORT_NOT_ACTIVE",
                        detail="Votre Passport n'est pas actif.",
                    )
                raise AppError(
                    status_code=404,
                    code="PASSPORT_NOT_FOUND",
                    detail="Passport introuvable.",
                )

            await self._repo.purge_expired(passport_id)

            live = await self._repo.live_sessions(passport_id)
            if live.count >= PRESENCE_MAX_LIVE_SESSIONS_PER_PASSPORT:
                # A live session can only exist if it has an expiry in the future.
                retry_after = live.seconds_until_first_expiry or 1
                logger.info(
                    "presence_session_limit_reached user_id=%s retry_after=%s",
                    user_id,
                    retry_after,
                )
                raise PresenceSessionLimitReached(retry_after)

            for _attempt in range(PRESENCE_SESSION_ISSUE_MAX_ATTEMPTS):
                credentials = issue_credentials(pepper)
                try:
                    async with self._session.begin_nested():
                        inserted = await self._repo.insert_session(
                            passport_id=passport_id,
                            user_id=user_id,
                            qr_token_hmac=credentials.qr_token_hmac,
                            manual_code_hmac=credentials.manual_code_hmac,
                        )
                except IntegrityError as exc:
                    if not is_digest_collision(exc):
                        raise
                    # The savepoint is rolled back: nothing of this draw remains.
                    logger.warning("presence_session_digest_collision user_id=%s", user_id)
                    continue

                await self._session.commit()
                logger.info(
                    "presence_session_issued session_id=%s user_id=%s",
                    inserted.id,
                    user_id,
                )
                return PresenceSessionResponse(
                    qr_payload=credentials.qr_payload,
                    manual_code=credentials.manual_code_display,
                    expires_at=inserted.expires_at,
                    refresh_after_seconds=PRESENCE_SESSION_REFRESH_AFTER_SECONDS,
                )

            logger.error("presence_session_issue_exhausted user_id=%s", user_id)
            raise AppError(
                status_code=503,
                code=PRESENCE_SESSION_UNAVAILABLE,
                detail="Service momentanément indisponible. Réessayez dans un instant.",
            )
        except BaseException:
            # Re-raised unchanged: the rollback only guarantees that nothing partial
            # (purge, savepoint, insert) survives an error, whatever its origin.
            await self._session.rollback()
            raise
