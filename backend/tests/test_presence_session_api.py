"""PASSPORT-PRESENCE-01 (01B) — ephemeral participant session, flag ON.

Covers ADR § 4 and § 6 with the CTO decisions D1-D4 of 01B: cap of 3 live sessions under
the Passport lock with ``Retry-After``, mandatory and fail-closed rate limiting,
``clock_timestamp()`` after the lock, digest collisions replayed in a savepoint, both
lock orders against a concurrent suspension, and no clear credential anywhere.
"""

from __future__ import annotations

import ast
import asyncio
import logging
import uuid
from collections.abc import AsyncIterator, Iterator
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from app.core import rate_limit
from app.core.config import get_settings
from app.core.presence_credentials import (
    IssuedCredentials,
    issue_credentials,
    manual_code_hmac,
    normalize_manual_code,
    parse_qr_payload,
    qr_token_hmac,
)
from app.db.session import get_session_factory
from app.integrations.redis import get_redis_client
from app.models.passport import Passport
from app.models.presence import PresenceSession
from app.repositories.presence_session_repository import PresenceSessionRepository
from httpx import AsyncClient, Response
from sqlalchemy import delete, func, select, text, update

from tests.conftest_passport import activate_passport
from tests.conftest_rbac import AuthenticatedUser, RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

URL = "/api/v1/passport/me/presence-session"
#: Test-only value, not a secret.
_TEST_PEPPER = "test-only-presence-pepper-not-a-secret-0001"
BACKEND_ROOT = Path(__file__).resolve().parents[1]
_EFFECT_TABLES = (
    "yuni_transactions",
    "passport_stamps",
    "citizen_local_stamps",
    "passport_offer_redemptions",
    "reputation_events",
    "user_passport_challenges",
    "passport_challenge_progress_events",
)


@pytest.fixture
def auth_env(auth_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Flag on before the application is built (routes are mounted at startup)."""
    monkeypatch.setenv("PRESENCE_VALIDATION_ENABLED", "true")
    monkeypatch.setenv("PRESENCE_TOKEN_PEPPER", _TEST_PEPPER)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    assert redis is not None, "presence requires Redis (D2 of 01B)"
    await redis.flushdb()
    yield
    await redis.flushdb()


# ------------------------------------------------------------------- helpers


def _factory() -> Any:
    factory = get_session_factory()
    assert factory is not None
    return factory


async def _participant(
    client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> tuple[AuthenticatedUser, uuid.UUID]:
    user = await rbac_user_factory()
    passport = await activate_passport(client, user.access_token)
    return user, uuid.UUID(str(passport["id"]))


async def _issue(client: AsyncClient, user: AuthenticatedUser, **headers: str) -> Response:
    return await client.post(URL, headers={**auth_header(user.access_token), **headers})


async def _sessions(passport_id: uuid.UUID) -> list[PresenceSession]:
    async with _factory()() as session:
        result = await session.execute(
            select(PresenceSession)
            .where(PresenceSession.passport_id == passport_id)
            .order_by(PresenceSession.expires_at)
        )
        return list(result.scalars().all())


async def _db_clock() -> datetime:
    async with _factory()() as session:
        value: datetime = (await session.execute(text("SELECT clock_timestamp()"))).scalar_one()
        return value


async def _set_passport_status(passport_id: uuid.UUID, status: str) -> None:
    async with _factory()() as session:
        await session.execute(
            update(Passport).where(Passport.id == passport_id).values(status=status)
        )
        await session.commit()


async def _shift_expiry(session_id: uuid.UUID, seconds: float) -> None:
    """Move a session's expiry to ``clock_timestamp() + seconds`` (negative: expired)."""
    async with _factory()() as session:
        await session.execute(
            text(
                "UPDATE presence_sessions SET expires_at = clock_timestamp() "
                "+ make_interval(secs => :s) WHERE id = :id"
            ),
            {"s": seconds, "id": session_id},
        )
        await session.commit()


async def _insert_expired_session(passport_id: uuid.UUID, user_id: uuid.UUID) -> uuid.UUID:
    session_id = uuid.uuid4()
    async with _factory()() as session:
        session.add(
            PresenceSession(
                id=session_id,
                passport_id=passport_id,
                user_id=user_id,
                qr_token_hmac=uuid.uuid4().hex * 2,
                manual_code_hmac=uuid.uuid4().hex * 2,
                expires_at=await _db_clock() - timedelta(minutes=5),
            )
        )
        await session.commit()
    return session_id


async def _effect_counts() -> dict[str, int]:
    async with _factory()() as session:
        return {
            table: int((await session.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one())
            for table in _EFFECT_TABLES
        }


async def _wait_for_lock_waiters(expected: int, timeout: float = 15.0) -> None:
    """Wait until ``expected`` backends of this database are blocked on a lock."""
    deadline = asyncio.get_running_loop().time() + timeout
    while asyncio.get_running_loop().time() < deadline:
        async with _factory()() as session:
            waiting = (
                await session.execute(
                    text(
                        "SELECT count(*) FROM pg_stat_activity "
                        "WHERE datname = current_database() AND wait_event_type = 'Lock'"
                    )
                )
            ).scalar_one()
        if int(waiting) >= expected:
            return
        await asyncio.sleep(0.05)
    raise AssertionError(f"expected {expected} lock waiter(s)")


def _secrets_of(body: dict[str, Any]) -> list[str]:
    """Every clear value and digest derived from an issuance response."""
    token = parse_qr_payload(body["qr_payload"])
    code = normalize_manual_code(body["manual_code"])
    assert token is not None and code is not None
    return [
        body["qr_payload"],
        token,
        body["manual_code"],
        code,
        qr_token_hmac(token, _TEST_PEPPER),
        manual_code_hmac(code, _TEST_PEPPER),
    ]


def _colliding(code_display: str) -> IssuedCredentials:
    """Fresh QR token, but the manual code of an already stored session."""
    code = normalize_manual_code(code_display)
    assert code is not None
    fresh = issue_credentials(_TEST_PEPPER)
    return IssuedCredentials(
        qr_token=fresh.qr_token,
        manual_code=code,
        qr_token_hmac=fresh.qr_token_hmac,
        manual_code_hmac=manual_code_hmac(code, _TEST_PEPPER),
    )


# ------------------------------------------------------------------ issuance


async def test_issuance_returns_credentials_once_and_stores_only_digests(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    before = await _db_clock()
    response = await _issue(auth_client, user)
    after = await _db_clock()

    assert response.status_code == 201, response.text
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["pragma"] == "no-cache"
    body = response.json()
    assert set(body) == {"qr_payload", "manual_code", "expires_at", "refresh_after_seconds"}
    assert body["refresh_after_seconds"] == 30
    assert parse_qr_payload(body["qr_payload"]) is not None
    assert len(body["manual_code"]) == 9 and body["manual_code"][4] == "-"
    expires_at = datetime.fromisoformat(body["expires_at"])
    assert before + timedelta(seconds=60) <= expires_at <= after + timedelta(seconds=60)

    (row,) = await _sessions(passport_id)
    token, code = _secrets_of(body)[1], _secrets_of(body)[3]
    assert row.user_id == user.user_id
    assert row.qr_token_hmac == qr_token_hmac(token, _TEST_PEPPER)
    assert row.manual_code_hmac == manual_code_hmac(code, _TEST_PEPPER)
    assert row.consumed_at is None
    stored = [str(value) for value in row.__dict__.values()]
    for clear in (body["qr_payload"], token, body["manual_code"], code):
        assert all(clear not in value for value in stored)


async def test_anonymous_is_refused_without_any_write(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    _user, passport_id = await _participant(auth_client, rbac_user_factory)
    response = await auth_client.post(URL)
    assert response.status_code == 401
    assert await _sessions(passport_id) == []


async def test_user_without_passport_gets_404(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user = await rbac_user_factory()
    # Registration already provides a Passport: remove it to reach the "absent" case.
    async with _factory()() as session:
        await session.execute(delete(Passport).where(Passport.user_id == user.user_id))
        await session.commit()
    response = await _issue(auth_client, user)
    assert response.status_code == 404
    assert response.json()["code"] == "PASSPORT_NOT_FOUND"
    async with _factory()() as session:
        count = await session.execute(
            select(func.count())
            .select_from(PresenceSession)
            .where(PresenceSession.user_id == user.user_id)
        )
        assert count.scalar_one() == 0


@pytest.mark.parametrize("status", ["suspended", "revoked"])
async def test_inactive_passport_gets_403_without_any_write(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, status: str
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    await _set_passport_status(passport_id, status)
    response = await _issue(auth_client, user)
    assert response.status_code == 403
    assert response.json()["code"] == "PASSPORT_NOT_ACTIVE"
    assert await _sessions(passport_id) == []


async def test_issuance_has_no_reward_side_effect(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, _passport_id = await _participant(auth_client, rbac_user_factory)
    before = await _effect_counts()
    assert (await _issue(auth_client, user)).status_code == 201
    assert await _effect_counts() == before


# --------------------------------------------------------- live session cap (D1)


async def test_fourth_live_session_is_refused_without_invalidating_any(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    bodies = []
    for _ in range(3):
        response = await _issue(auth_client, user)
        assert response.status_code == 201
        bodies.append(response.json())
    live_before = [(s.id, s.expires_at, s.consumed_at) for s in await _sessions(passport_id)]

    refused = await _issue(auth_client, user)

    assert refused.status_code == 429
    assert refused.json() == {
        "detail": refused.json()["detail"],
        "code": "PRESENCE_SESSION_LIMIT_REACHED",
        "errors": [],
    }
    retry_after = int(refused.headers["retry-after"])
    assert 1 <= retry_after <= 60
    assert refused.headers["cache-control"] == "no-store"
    for body in bodies:
        for secret in _secrets_of(body):
            assert secret not in refused.text
            assert secret not in str(refused.headers)
    live_after = [(s.id, s.expires_at, s.consumed_at) for s in await _sessions(passport_id)]
    assert live_after == live_before


async def test_retry_after_follows_the_first_expiry(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    for _ in range(3):
        assert (await _issue(auth_client, user)).status_code == 201
    first = (await _sessions(passport_id))[0]
    await _shift_expiry(first.id, 4.2)

    refused = await _issue(auth_client, user)
    assert refused.status_code == 429
    assert 1 <= int(refused.headers["retry-after"]) <= 5


async def test_expired_session_is_purged_and_frees_a_slot(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    for _ in range(3):
        assert (await _issue(auth_client, user)).status_code == 201
    expired = (await _sessions(passport_id))[0]
    await _shift_expiry(expired.id, -1)

    assert (await _issue(auth_client, user)).status_code == 201
    remaining = {s.id for s in await _sessions(passport_id)}
    assert expired.id not in remaining
    assert len(remaining) == 3


async def test_consumed_session_does_not_count_and_is_kept_until_expiry(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    for _ in range(3):
        assert (await _issue(auth_client, user)).status_code == 201
    consumed = (await _sessions(passport_id))[0]
    async with _factory()() as session:
        await session.execute(
            text("UPDATE presence_sessions SET consumed_at = clock_timestamp() WHERE id = :id"),
            {"id": consumed.id},
        )
        await session.commit()

    assert (await _issue(auth_client, user)).status_code == 201
    rows = await _sessions(passport_id)
    assert len(rows) == 4
    assert consumed.id in {s.id for s in rows}


async def test_purge_only_touches_the_issuing_passport(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user_a, _passport_a = await _participant(auth_client, rbac_user_factory)
    user_b, passport_b = await _participant(auth_client, rbac_user_factory)
    expired_b = await _insert_expired_session(passport_b, user_b.user_id)

    assert (await _issue(auth_client, user_a)).status_code == 201
    assert expired_b in {s.id for s in await _sessions(passport_b)}


async def test_concurrent_issuance_never_exceeds_the_cap(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    responses = await asyncio.gather(*(_issue(auth_client, user) for _ in range(6)))
    codes = sorted(r.status_code for r in responses)
    assert codes == [201, 201, 201, 429, 429, 429]
    assert len(await _sessions(passport_id)) == 3


# ------------------------------------------------------------ rate limiting (D2, D3)


async def test_per_user_rate_limit(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PRESENCE_SESSION_USER_LIMIT_PER_HOUR", "2")
    get_settings.cache_clear()
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    assert (await _issue(auth_client, user)).status_code == 201
    assert (await _issue(auth_client, user)).status_code == 201
    limited = await _issue(auth_client, user)
    assert limited.status_code == 429
    assert limited.json()["code"] == "RATE_LIMITED"
    assert len(await _sessions(passport_id)) == 2


async def test_per_ip_rate_limit_is_keyed_without_a_clear_ip(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PRESENCE_SESSION_IP_LIMIT_PER_HOUR", "2")
    get_settings.cache_clear()
    ip = "203.0.113.77"
    users = [await _participant(auth_client, rbac_user_factory) for _ in range(3)]
    statuses = [
        (await _issue(auth_client, user, **{"X-Forwarded-For": ip})).status_code
        for user, _ in users
    ]
    assert statuses == [201, 201, 429]
    assert await _sessions(users[2][1]) == []

    redis = get_redis_client()
    assert redis is not None
    keys = [k.decode() if isinstance(k, bytes) else str(k) for k in await redis.keys("*")]
    presence_keys = [k for k in keys if k.startswith("presence:session:")]
    assert presence_keys
    assert all(ip not in key for key in presence_keys)


async def test_redis_failure_is_fail_closed_without_any_write(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)

    async def _broken(*_args: object, **_kwargs: object) -> int:
        raise ConnectionError("redis down")

    monkeypatch.setattr(rate_limit, "_incr_with_ttl", _broken)
    response = await _issue(auth_client, user)
    assert response.status_code == 503
    assert response.json()["code"] == "RATE_LIMIT_BACKEND_UNAVAILABLE"
    assert await _sessions(passport_id) == []


# ------------------------------------------------------- collisions and rollback


async def test_digest_collision_is_redrawn_in_a_savepoint(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A stored code digest is hit (probability ~ N / 2**40 in reality): one redraw."""
    user_a, _passport_a = await _participant(auth_client, rbac_user_factory)
    first = (await _issue(auth_client, user_a)).json()
    user_b, passport_b = await _participant(auth_client, rbac_user_factory)
    draws = iter([_colliding(first["manual_code"]), issue_credentials(_TEST_PEPPER)])
    monkeypatch.setattr(
        "app.services.presence_session_service.issue_credentials", lambda _pepper: next(draws)
    )

    response = await _issue(auth_client, user_b)

    assert response.status_code == 201
    (row,) = await _sessions(passport_b)
    assert row.manual_code_hmac != manual_code_hmac(
        normalize_manual_code(first["manual_code"]) or "", _TEST_PEPPER
    )


async def test_repeated_collisions_give_503_and_leave_nothing(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    user_a, _passport_a = await _participant(auth_client, rbac_user_factory)
    first = (await _issue(auth_client, user_a)).json()
    user_b, passport_b = await _participant(auth_client, rbac_user_factory)
    expired_b = await _insert_expired_session(passport_b, user_b.user_id)
    monkeypatch.setattr(
        "app.services.presence_session_service.issue_credentials",
        lambda _pepper: _colliding(first["manual_code"]),
    )

    response = await _issue(auth_client, user_b)

    assert response.status_code == 503
    assert response.json()["code"] == "PRESENCE_SESSION_UNAVAILABLE"
    # The purge itself is rolled back: the whole transaction left nothing behind.
    assert [s.id for s in await _sessions(passport_b)] == [expired_b]
    for secret in _secrets_of(first):
        assert secret not in response.text


async def test_database_error_rolls_back_the_purge_and_the_insert(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    expired = await _insert_expired_session(passport_id, user.user_id)

    async def _failing_insert(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("simulated database failure")

    monkeypatch.setattr(PresenceSessionRepository, "insert_session", _failing_insert)
    with pytest.raises(RuntimeError, match="simulated database failure"):
        await _issue(auth_client, user)
    assert [s.id for s in await _sessions(passport_id)] == [expired]


# ------------------------------------------- clock and concurrent suspension (D4)


async def test_expiry_uses_the_wall_clock_after_the_lock_wait(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    """With ``now()`` the session would lose the time spent waiting (D4)."""
    user, _passport_id = await _participant(auth_client, rbac_user_factory)
    async with _factory()() as blocker:
        await blocker.execute(text("LOCK TABLE presence_sessions IN SHARE MODE"))
        task = asyncio.create_task(_issue(auth_client, user))
        await _wait_for_lock_waiters(1)
        await asyncio.sleep(3)
        released_at: datetime = (
            await blocker.execute(text("SELECT clock_timestamp()"))
        ).scalar_one()
        await blocker.commit()
    response = await task
    assert response.status_code == 201
    expires_at = datetime.fromisoformat(response.json()["expires_at"])
    assert expires_at >= released_at + timedelta(seconds=59.5)


async def test_suspension_committed_first_wins_over_a_waiting_issuance(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    """Lock order 1: the suspension holds the Passport row, issuance waits, then sees it."""
    user, passport_id = await _participant(auth_client, rbac_user_factory)
    async with _factory()() as suspender:
        await suspender.execute(
            update(Passport).where(Passport.id == passport_id).values(status="suspended")
        )
        task = asyncio.create_task(_issue(auth_client, user))
        await _wait_for_lock_waiters(1)
        await suspender.commit()
    response = await task
    assert response.status_code == 403
    assert response.json()["code"] == "PASSPORT_NOT_ACTIVE"
    assert await _sessions(passport_id) == []


async def test_issuance_holding_the_lock_completes_before_a_suspension(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    """Lock order 2: issuance holds the Passport row; the suspension waits for its commit."""
    user, passport_id = await _participant(auth_client, rbac_user_factory)

    async def _suspend() -> None:
        async with _factory()() as suspender:
            await suspender.execute(
                update(Passport).where(Passport.id == passport_id).values(status="suspended")
            )
            await suspender.commit()

    async with _factory()() as blocker:
        # Issuance takes the Passport lock, then blocks on the session table.
        await blocker.execute(text("LOCK TABLE presence_sessions IN SHARE MODE"))
        issuance = asyncio.create_task(_issue(auth_client, user))
        await _wait_for_lock_waiters(1)
        suspension = asyncio.create_task(_suspend())
        await _wait_for_lock_waiters(2)
        assert not suspension.done()
        await blocker.commit()
    response = await issuance
    await suspension

    assert response.status_code == 201
    assert len(await _sessions(passport_id)) == 1
    async with _factory()() as session:
        status = (
            await session.execute(select(Passport.status).where(Passport.id == passport_id))
        ).scalar_one()
    assert status == "suspended"
    # The next request sees the suspension.
    assert (await _issue(auth_client, user)).status_code == 403


# ---------------------------------------------------------------- secrets


async def test_no_clear_credential_in_logs_or_redis(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # alembic/env.py runs logging.config.fileConfig() with disable_existing_loggers=True
    # when a migration test ran earlier in the same process: re-enable every ``app.*``
    # logger (restored by monkeypatch), or this test would pass on an empty capture.
    for name, candidate in list(logging.root.manager.loggerDict.items()):
        if (name == "app" or name.startswith("app.")) and isinstance(candidate, logging.Logger):
            monkeypatch.setattr(candidate, "disabled", False)
    caplog.set_level(logging.DEBUG)
    user_a, _ = await _participant(auth_client, rbac_user_factory)
    bodies = [(await _issue(auth_client, user_a)).json() for _ in range(3)]
    assert (await _issue(auth_client, user_a)).status_code == 429
    user_b, _ = await _participant(auth_client, rbac_user_factory)
    draws = iter([_colliding(bodies[0]["manual_code"]), issue_credentials(_TEST_PEPPER)])
    monkeypatch.setattr(
        "app.services.presence_session_service.issue_credentials", lambda _pepper: next(draws)
    )
    bodies.append((await _issue(auth_client, user_b)).json())

    redis = get_redis_client()
    assert redis is not None
    keys = " ".join(str(k) for k in await redis.keys("*"))
    assert "presence_session_issued" in caplog.text
    for body in bodies:
        for secret in _secrets_of(body):
            assert secret not in caplog.text
            assert secret not in keys


# --------------------------------------------------------------- isolation


async def test_lot_modules_import_no_reward_domain() -> None:
    """Static check: the 01B modules cannot trigger Yunimoney, stamps, rewards, etc."""
    forbidden = ("yuni", "reward", "reputation", "challenge", "stamp", "redemption", "scan")
    modules = (
        "app/core/presence_credentials.py",
        "app/repositories/presence_session_repository.py",
        "app/services/presence_session_service.py",
        "app/schemas/presence_session.py",
        "app/api/v1/presence_participant.py",
    )
    for relative in modules:
        tree = ast.parse((BACKEND_ROOT / relative).read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            names: list[str] = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module, *(f"{node.module}.{a.name}" for a in node.names)]
            for name in names:
                assert not any(word in name.lower() for word in forbidden), (relative, name)
