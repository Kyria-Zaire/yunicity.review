"""QA baseline launcher (C3-F0-T1).

Single sanctioned entry point for destructive/seed QA operations. It generates
the explicit QA run marker, invokes the anti-production guard, and then runs the
requested step against ``TEST_DATABASE_URL`` (never ``DATABASE_URL``).

Usage (inside the backend-qa container or a QA-configured shell):

    python -m app.qa.launcher guard-check
    python -m app.qa.launcher reset
    python -m app.qa.launcher seed
    python -m app.qa.launcher verify

Reset only drops the schema; run ``alembic upgrade head`` afterwards, then ``seed``.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import uuid
from typing import Any, cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.seeds.qa_fixtures import EXPECTED_VOLUMES, seed_qa_fixtures
from app.models.local_event import EventInterest, LocalEvent
from app.models.local_video import LocalVideo
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer, Passport
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_profile import UserProfile
from app.qa.guard import (
    QA_MODE_ENV,
    QA_TOKEN_ENV,
    REDIS_URL_ENV,
    QaGuardError,
    ensure_qa_destructive_target,
    ensure_qa_redis_target,
    resolve_test_database_url,
)
from app.qa.reset import reset_qa_schema

_COUNT_MODELS: dict[str, type] = {
    "users": User,
    "profiles": UserProfile,
    "tribes": Tribe,
    "tribe_members": TribeMember,
    "posts": Post,
    "events": LocalEvent,
    "event_interests": EventInterest,
    "organizations": Organization,
    "partner_profiles": PartnerProfile,
    "partner_offers": PartnerOffer,
    "local_videos": LocalVideo,
    "notifications": UserNotification,
    "passports": Passport,
}


def _prepare_qa_marker() -> None:
    """Make QA mode explicit and mint a run token if the operator did not pass one."""
    os.environ[QA_MODE_ENV] = "1"
    if not os.environ.get(QA_TOKEN_ENV, "").strip():
        os.environ[QA_TOKEN_ENV] = f"qa-{uuid.uuid4()}"


def _new_sessionmaker() -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(resolve_test_database_url(), pool_pre_ping=True)
    return async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def _cmd_guard_check() -> int:
    target = ensure_qa_destructive_target()
    print(target.confirmation())
    return 0


async def _cmd_reset() -> int:
    target = await reset_qa_schema()
    print(f"reset OK -> {target.confirmation()}")
    return 0


async def _cmd_seed() -> int:
    target = ensure_qa_destructive_target()
    print(f"seed target -> {target.confirmation()}")
    sessionmaker = _new_sessionmaker()
    async with sessionmaker() as session:
        report = await seed_qa_fixtures(session)
    print(f"seed OK reference_now={report.reference_now.isoformat()}")
    for key, value in report.counts.items():
        print(f"  created[{key}]={value}")
    return 0


async def _cmd_verify() -> int:
    target = ensure_qa_destructive_target()
    print(f"verify target -> {target.confirmation()}")
    sessionmaker = _new_sessionmaker()
    ok = True
    async with sessionmaker() as session:
        for key, model in _COUNT_MODELS.items():
            result = await session.execute(select(func.count()).select_from(model))
            actual = int(result.scalar_one())
            expected = EXPECTED_VOLUMES[key]
            status = "OK" if actual == expected else "MISMATCH"
            if actual != expected:
                ok = False
            print(f"  {key}: expected={expected} actual={actual} [{status}]")
    print("verify PASS" if ok else "verify FAIL")
    return 0 if ok else 1


async def _cmd_reset_rate_limits() -> int:
    """Flush the disposable QA Redis (clears rate-limit counters). Guarded, QA-only.

    Never disables the rate limiter — only resets its counters between account-creating
    E2E groups so the run is not contaminated by prior registrations.
    """
    target = ensure_qa_redis_target()
    from redis.asyncio import Redis

    client = Redis.from_url(os.environ[REDIS_URL_ENV].strip())
    try:
        await client.flushdb()
    finally:
        await cast(Any, client).aclose()
    print(f"rate-limit reset OK -> {target.confirmation()}")
    return 0


_COMMANDS = {
    "guard-check": _cmd_guard_check,
    "reset": _cmd_reset,
    "reset-rate-limits": _cmd_reset_rate_limits,
    "seed": _cmd_seed,
    "verify": _cmd_verify,
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="app.qa.launcher", description="QA baseline launcher")
    parser.add_argument("command", choices=sorted(_COMMANDS))
    args = parser.parse_args(argv)

    _prepare_qa_marker()
    try:
        return asyncio.run(_COMMANDS[args.command]())
    except QaGuardError as exc:
        print(f"GUARD REFUSED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
