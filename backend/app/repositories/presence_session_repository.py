"""Data access for ephemeral presence sessions (PASSPORT-PRESENCE-01B, ADR § 4 and § 6).

Every time-based decision uses the PostgreSQL wall clock ``clock_timestamp()``, never
``now()``: ``now()`` is frozen at the start of the transaction, so a request that waited
for the Passport row lock would otherwise issue a session whose lifetime had already
partly elapsed (CTO decision D4).

Only peppered digests are written; this module never sees a clear token or code.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import (
    DateTime,
    Interval,
    delete,
    exists,
    extract,
    func,
    insert,
    literal,
    select,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.passport_constants import PassportStatus
from app.core.presence_constants import PRESENCE_SESSION_TTL_SECONDS
from app.core.sql_error_redaction import iter_linked
from app.models.passport import Passport
from app.models.presence import PresenceSession

#: Unique constraints whose violation means "digest already stored": draw again.
DIGEST_UNIQUE_CONSTRAINTS = frozenset(
    {"uq_presence_sessions_qr_token_hmac", "uq_presence_sessions_manual_code_hmac"}
)


def db_clock() -> ColumnElement[datetime]:
    """PostgreSQL wall clock, re-read at each evaluation (unlike ``now()``)."""
    return func.clock_timestamp(type_=DateTime(timezone=True))


def is_digest_collision(exc: IntegrityError) -> bool:
    """True only for a unique violation on a session digest.

    Reads the constraint name from the driver error chain; never formats the exception,
    whose parameters contain digests.
    """
    for link in iter_linked(exc):
        name = getattr(link, "constraint_name", None)
        if isinstance(name, str) and name:
            return name in DIGEST_UNIQUE_CONSTRAINTS
    return False


@dataclass(frozen=True, slots=True)
class LiveSessions:
    count: int
    #: Whole seconds until the first live session expires (rounded up, at least 1);
    #: ``None`` when there is no live session.
    seconds_until_first_expiry: int | None


@dataclass(frozen=True, slots=True)
class InsertedSession:
    id: uuid.UUID
    expires_at: datetime


class PresenceSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def lock_active_passport(self, user_id: uuid.UUID) -> uuid.UUID | None:
        """Lock the user's active Passport row for the rest of the transaction.

        ``FOR UPDATE`` re-evaluates the ``status`` predicate on the latest row version
        once the lock is granted: a suspension committed while this request waited makes
        it return ``None``, so the state check and the lock are a single step.
        """
        result = await self._session.execute(
            select(Passport.id)
            .where(
                Passport.user_id == user_id,
                Passport.status == PassportStatus.ACTIVE.value,
            )
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def user_has_passport(self, user_id: uuid.UUID) -> bool:
        result = await self._session.execute(select(exists().where(Passport.user_id == user_id)))
        return bool(result.scalar_one())

    async def purge_expired(self, passport_id: uuid.UUID) -> None:
        """Delete this Passport's expired sessions. A live session is never touched."""
        await self._session.execute(
            delete(PresenceSession).where(
                PresenceSession.passport_id == passport_id,
                PresenceSession.expires_at <= db_clock(),
            )
        )

    async def live_sessions(self, passport_id: uuid.UUID) -> LiveSessions:
        """Count live sessions (``consumed_at IS NULL AND expires_at > clock_timestamp()``).

        The delay before the first expiry is computed by PostgreSQL on the same clock.
        """
        first_expiry = func.min(PresenceSession.expires_at)
        seconds = func.ceil(extract("epoch", first_expiry - db_clock()))
        result = await self._session.execute(
            select(func.count(), seconds).where(
                PresenceSession.passport_id == passport_id,
                PresenceSession.consumed_at.is_(None),
                PresenceSession.expires_at > db_clock(),
            )
        )
        count, raw_seconds = result.one()
        if raw_seconds is None:
            return LiveSessions(count=int(count), seconds_until_first_expiry=None)
        return LiveSessions(count=int(count), seconds_until_first_expiry=max(1, int(raw_seconds)))

    async def insert_session(
        self,
        *,
        passport_id: uuid.UUID,
        user_id: uuid.UUID,
        qr_token_hmac: str,
        manual_code_hmac: str,
    ) -> InsertedSession:
        """Insert a session expiring ``clock_timestamp() + TTL``, read after the lock."""
        ttl = literal(timedelta(seconds=PRESENCE_SESSION_TTL_SECONDS), Interval())
        result = await self._session.execute(
            insert(PresenceSession)
            .values(
                id=uuid.uuid4(),
                passport_id=passport_id,
                user_id=user_id,
                qr_token_hmac=qr_token_hmac,
                manual_code_hmac=manual_code_hmac,
                created_at=db_clock(),
                expires_at=db_clock() + ttl,
            )
            .returning(PresenceSession.id, PresenceSession.expires_at)
        )
        row = result.one()
        return InsertedSession(id=row.id, expires_at=row.expires_at)
