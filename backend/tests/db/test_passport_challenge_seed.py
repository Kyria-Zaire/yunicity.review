"""Passport challenge seed tests (PASSPORT-04A)."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
from app.core.passport_badge_constants import PassportBadgeCode
from app.core.passport_challenge_constants import (
    MVP_ACTIVE_CHALLENGE_CODES,
    MVP_INACTIVE_CHALLENGE_CODES,
    MVP_PASSPORT_CHALLENGE_CODES,
    PassportChallengeCode,
)
from app.db.base import Base
from app.db.seeds.passport_challenges import seed_passport_challenges
from app.db.session import dispose_db, get_engine, init_db
from app.models.passport_challenge import PassportChallenge
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def challenge_seed_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[AsyncSession, None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport challenge seed tests")
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
        yield session

    await dispose_db()
    get_settings.cache_clear()


async def test_seed_creates_four_challenges(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    codes = set(
        (
            await challenge_seed_db.scalars(
                select(PassportChallenge.code).where(
                    PassportChallenge.code.in_(MVP_PASSPORT_CHALLENGE_CODES)
                )
            )
        ).all()
    )
    assert codes == set(MVP_PASSPORT_CHALLENGE_CODES)
    assert len(codes) == 4


async def test_seed_is_idempotent(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()
    first_count = await challenge_seed_db.scalar(
        select(func.count()).select_from(PassportChallenge)
    )

    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()
    second_count = await challenge_seed_db.scalar(
        select(func.count()).select_from(PassportChallenge)
    )

    assert first_count == 4
    assert second_count == 4


async def test_seed_updates_existing_challenge_metadata(
    challenge_seed_db: AsyncSession,
) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    challenge = await challenge_seed_db.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.EXPLORER_CENTRE_VILLE.value
        )
    )
    assert challenge is not None
    challenge.name = "Nom obsolète"
    await challenge_seed_db.commit()

    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()
    await challenge_seed_db.refresh(challenge)

    assert challenge.name == "Explorateur du centre-ville"


async def test_challenge_codes_are_unique(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    total = await challenge_seed_db.scalar(select(func.count()).select_from(PassportChallenge))
    distinct_codes = await challenge_seed_db.scalar(
        select(func.count(func.distinct(PassportChallenge.code))).select_from(PassportChallenge)
    )
    assert total == distinct_codes == 4


async def test_target_value_positive(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    challenges = list((await challenge_seed_db.scalars(select(PassportChallenge))).all())
    assert challenges
    for challenge in challenges:
        assert challenge.target_value > 0
        assert challenge.ym_reward >= 0


async def test_inactive_event_challenge_exists(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    challenge = await challenge_seed_db.scalar(
        select(PassportChallenge).where(
            PassportChallenge.code == PassportChallengeCode.SORTIES_REMOISES.value
        )
    )
    assert challenge is not None
    assert challenge.is_active is False
    assert challenge.challenge_type == "events"


async def test_badge_links_are_correct(challenge_seed_db: AsyncSession) -> None:
    await seed_passport_challenges(challenge_seed_db)
    await challenge_seed_db.commit()

    expected_links = {
        PassportChallengeCode.EXPLORER_CENTRE_VILLE.value: (
            PassportBadgeCode.EXPLORATEUR_REIMS.value
        ),
        PassportChallengeCode.SOUTIEN_LOCAL_HEBDO.value: PassportBadgeCode.SOUTIEN_LOCAL.value,
        PassportChallengeCode.SORTIES_REMOISES.value: PassportBadgeCode.AMATEUR_SPECTACLES.value,
        PassportChallengeCode.PREMIER_CERCLE.value: PassportBadgeCode.PIONNIER_YUNICITY.value,
    }
    for challenge_code, badge_code in expected_links.items():
        challenge = await challenge_seed_db.scalar(
            select(PassportChallenge).where(PassportChallenge.code == challenge_code)
        )
        assert challenge is not None
        assert challenge.badge_code == badge_code

    active_codes = set(
        (
            await challenge_seed_db.scalars(
                select(PassportChallenge.code).where(
                    PassportChallenge.code.in_(MVP_ACTIVE_CHALLENGE_CODES),
                    PassportChallenge.is_active.is_(True),
                )
            )
        ).all()
    )
    assert active_codes == set(MVP_ACTIVE_CHALLENGE_CODES)
    assert MVP_INACTIVE_CHALLENGE_CODES <= set(MVP_PASSPORT_CHALLENGE_CODES)
