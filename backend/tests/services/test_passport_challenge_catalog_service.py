"""PassportChallengeCatalogService tests (PASSPORT-04A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

import pytest
from app.core.passport_challenge_constants import (
    MVP_ACTIVE_CHALLENGE_CODES,
    PassportChallengeCode,
)
from app.db.base import Base
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.session import dispose_db, get_engine, init_db
from app.models.passport_challenge import PassportChallenge, UserPassportChallenge
from app.models.user import User
from app.services.passport_challenge_catalog_service import PassportChallengeCatalogService
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_catalog_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge catalog tests")
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
            email=f"challenge-catalog-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Challenge Catalog Tester",
            city="Reims",
        )
        session.add(user)
        await session.commit()
        yield session, user.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> PassportChallengeCatalogService:
    return PassportChallengeCatalogService(session)


async def _seed_catalog(session: AsyncSession) -> None:
    await seed_passport_challenges(session)
    await session.commit()


async def test_list_active_excludes_inactive(
    challenge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = challenge_catalog_db
    await _seed_catalog(session)

    challenges = await _service(session).list_active_challenges()
    codes = {challenge.code for challenge in challenges}

    assert PassportChallengeCode.SORTIES_REMOISES.value not in codes
    assert codes == set(MVP_ACTIVE_CHALLENGE_CODES)
    assert len(challenges) == 3


async def test_get_challenge_by_code_returns_expected(
    challenge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = challenge_catalog_db
    await _seed_catalog(session)

    challenge = await _service(session).get_challenge_by_code(
        PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value
    )
    assert challenge is not None
    assert challenge.name == "Soutien local"
    assert challenge.challenge_type == "redemptions"
    assert challenge.target_value == 3


async def test_active_challenges_are_ordered(
    challenge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = challenge_catalog_db
    await _seed_catalog(session)

    challenges = await _service(session).list_active_challenges()
    orders = [challenge.display_order for challenge in challenges]
    assert orders == sorted(orders)


async def test_ensure_mvp_challenges_seeds_catalog(
    challenge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = challenge_catalog_db
    await _service(session).ensure_mvp_challenges()
    await session.commit()

    count = len(await _service(session).list_active_challenges())
    assert count == 3


async def test_user_challenge_unique_constraint(
    challenge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = challenge_catalog_db
    await _seed_catalog(session)

    challenge = await session.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
        )
    )
    assert challenge is not None

    session.add(
        UserPassportChallenge(
            user_id=user_id,
            challenge_id=challenge.id,
            target_value=challenge.target_value,
        )
    )
    await session.commit()

    session.add(
        UserPassportChallenge(
            user_id=user_id,
            challenge_id=challenge.id,
            target_value=challenge.target_value,
        )
    )
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()
