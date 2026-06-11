"""PassportReputationService tests (PASSPORT-01A)."""

from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from app.core.errors import AppError
from app.core.passport_reputation_constants import (
    STAMP_EARNED_POINTS,
    PassportReputationEventType,
    PassportReputationSourceType,
)
from app.db.base import Base
from app.db.session import dispose_db, get_engine, init_db
from app.models.passport_reputation import ReputationEvent, UserReputationSnapshot
from app.models.user import User
from app.services.passport_reputation_service import PassportReputationService
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def reputation_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport reputation service tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long!!")

    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    init_db(settings)
    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"reputation-test-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Reputation Tester",
            city="Reims",
        )
        session.add(user)
        await session.commit()
        yield session, user.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> PassportReputationService:
    return PassportReputationService(session)


async def test_award_points_creates_event_and_snapshot(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)
    source_id = uuid.uuid4()

    event = await service.award_points(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        STAMP_EARNED_POINTS,
        source_id=source_id,
    )

    assert event.points == STAMP_EARNED_POINTS
    snapshot = await service.get_reputation(user_id)
    assert snapshot.total_points == STAMP_EARNED_POINTS
    assert snapshot.last_event_at is not None


async def test_award_points_rejects_invalid_event_type(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)

    with pytest.raises(AppError) as exc_info:
        await service.award_points(
            user_id,
            "unknown_event",
            PassportReputationSourceType.PASSPORT_STAMP.value,
            10,
            source_id=uuid.uuid4(),
        )
    assert exc_info.value.code == "REPUTATION_INVALID_EVENT_TYPE"


async def test_award_points_rejects_invalid_source_type(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)

    with pytest.raises(AppError) as exc_info:
        await service.award_points(
            user_id,
            PassportReputationEventType.STAMP_EARNED.value,
            "unknown_source",
            10,
            source_id=uuid.uuid4(),
        )
    assert exc_info.value.code == "REPUTATION_INVALID_SOURCE_TYPE"


@pytest.mark.parametrize("points", [0, -5])
async def test_award_points_rejects_non_positive_points(
    reputation_db: tuple[AsyncSession, uuid.UUID],
    points: int,
) -> None:
    session, user_id = reputation_db
    service = _service(session)

    with pytest.raises(AppError) as exc_info:
        await service.award_points(
            user_id,
            PassportReputationEventType.STAMP_EARNED.value,
            PassportReputationSourceType.PASSPORT_STAMP.value,
            points,
            source_id=uuid.uuid4(),
        )
    assert exc_info.value.code == "REPUTATION_INVALID_POINTS"


async def test_award_points_is_idempotent_for_same_source(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)
    source_id = uuid.uuid4()

    first = await service.award_points(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        10,
        source_id=source_id,
    )
    second = await service.award_points(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        10,
        source_id=source_id,
    )

    assert first.id == second.id
    snapshot = await service.get_reputation(user_id)
    assert snapshot.total_points == 10

    count_result = await session.execute(
        select(func.count())
        .select_from(ReputationEvent)
        .where(ReputationEvent.user_id == user_id)
    )
    assert count_result.scalar_one() == 1


async def test_get_reputation_returns_zero_for_new_user(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)

    snapshot = await service.get_reputation(user_id)
    assert snapshot.total_points == 0
    assert snapshot.last_event_at is None

    persisted = await session.get(UserReputationSnapshot, user_id)
    assert persisted is None


async def test_rebuild_snapshot_recomputes_exact_total(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = reputation_db
    service = _service(session)

    await service.award_points(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        5,
        source_id=uuid.uuid4(),
    )
    await service.award_points(
        user_id,
        PassportReputationEventType.EVENT_ATTENDED.value,
        PassportReputationSourceType.LOCAL_EVENT.value,
        10,
        source_id=uuid.uuid4(),
    )

    snapshot = await session.get(UserReputationSnapshot, user_id)
    assert snapshot is not None
    snapshot.total_points = 0
    await session.commit()

    rebuilt = await service.rebuild_snapshot(user_id)
    assert rebuilt.total_points == 15


async def test_concurrent_awards_do_not_corrupt_snapshot(
    reputation_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    _session, user_id = reputation_db
    from app.db.session import get_engine

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def award(source_id: uuid.UUID, points: int) -> None:
        async with factory() as session:
            service = PassportReputationService(session)
            await service.award_points(
                user_id,
                PassportReputationEventType.STAMP_EARNED.value,
                PassportReputationSourceType.PASSPORT_STAMP.value,
                points,
                source_id=source_id,
            )

    await asyncio.gather(
        award(uuid.uuid4(), 5),
        award(uuid.uuid4(), 7),
        award(uuid.uuid4(), 3),
    )

    async with factory() as session:
        service = PassportReputationService(session)
        snapshot = await service.get_reputation(user_id)
        assert snapshot.total_points == 15


async def test_metadata_is_stored(reputation_db: tuple[AsyncSession, uuid.UUID]) -> None:
    session, user_id = reputation_db
    service = _service(session)
    metadata = {"note": "test attribution", "origin": "unit-test"}

    event = await service.award_points(
        user_id,
        PassportReputationEventType.MANUAL_ADJUSTMENT.value,
        PassportReputationSourceType.ADMIN_ACTION.value,
        12,
        source_id=uuid.uuid4(),
        metadata=metadata,
    )

    assert event.metadata_ == metadata


async def test_no_delete_or_negative_reputation_path() -> None:
    service = PassportReputationService(session=MagicMock())
    public_methods = [
        name
        for name in dir(service)
        if not name.startswith("_") and callable(getattr(service, name))
    ]
    assert "award_points" in public_methods
    assert "rebuild_snapshot" in public_methods
    forbidden = {"deduct_points", "remove_points", "decrement_points", "revoke_points"}
    assert forbidden.isdisjoint(set(public_methods))


async def test_has_existing_event(reputation_db: tuple[AsyncSession, uuid.UUID]) -> None:
    session, user_id = reputation_db
    service = _service(session)
    source_id = uuid.uuid4()

    assert not await service.has_existing_event(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        source_id,
    )

    await service.award_points(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        5,
        source_id=source_id,
    )

    assert await service.has_existing_event(
        user_id,
        PassportReputationEventType.STAMP_EARNED.value,
        PassportReputationSourceType.PASSPORT_STAMP.value,
        source_id,
    )
