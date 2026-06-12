"""Passport badge seed tests (PASSPORT-03A)."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
from app.core.passport_badge_constants import (
    MVP_PASSPORT_BADGE_CODES,
    MVP_SECRET_BADGE_CODES,
    MVP_VISIBLE_BADGE_CODES,
    PassportBadgeCode,
)
from app.db.base import Base
from app.db.seeds.passport_badges import seed_passport_badges
from app.db.session import dispose_db, get_engine, init_db
from app.models.passport_badge import PassportBadge
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def badge_seed_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[AsyncSession, None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport badge seed tests")
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


async def test_seed_creates_mvp_badges(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    codes = set(
        (
            await badge_seed_db.scalars(
                select(PassportBadge.code).where(
                    PassportBadge.code.in_(MVP_PASSPORT_BADGE_CODES)
                )
            )
        ).all()
    )
    assert codes == set(MVP_PASSPORT_BADGE_CODES)
    assert len(codes) == 6


async def test_seed_is_idempotent(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()
    first_count = await badge_seed_db.scalar(select(func.count()).select_from(PassportBadge))

    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()
    second_count = await badge_seed_db.scalar(select(func.count()).select_from(PassportBadge))

    assert first_count == 6
    assert second_count == 6


async def test_seed_updates_existing_badge_metadata(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    badge = await badge_seed_db.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.EXPLORATEUR_REIMS.value
        )
    )
    assert badge is not None
    badge.name = "Nom obsolète"
    await badge_seed_db.commit()

    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()
    await badge_seed_db.refresh(badge)

    assert badge.name == "Explorateur de Reims"


async def test_badge_codes_are_unique(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    total = await badge_seed_db.scalar(select(func.count()).select_from(PassportBadge))
    distinct_codes = await badge_seed_db.scalar(
        select(func.count(func.distinct(PassportBadge.code))).select_from(PassportBadge)
    )
    assert total == distinct_codes == 6


async def test_badge_rewards_are_non_negative(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    badges = list((await badge_seed_db.scalars(select(PassportBadge))).all())
    assert badges
    for badge in badges:
        assert badge.reputation_reward >= 0
        assert badge.ym_reward >= 0


async def test_secret_badges_exist_in_seed(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    secret_codes = set(
        (
            await badge_seed_db.scalars(
                select(PassportBadge.code).where(
                    PassportBadge.code.in_(MVP_SECRET_BADGE_CODES)
                )
            )
        ).all()
    )
    assert secret_codes == set(MVP_SECRET_BADGE_CODES)


async def test_visible_badges_exist_in_seed(badge_seed_db: AsyncSession) -> None:
    await seed_passport_badges(badge_seed_db)
    await badge_seed_db.commit()

    visible_codes = set(
        (
            await badge_seed_db.scalars(
                select(PassportBadge.code).where(
                    PassportBadge.code.in_(MVP_VISIBLE_BADGE_CODES)
                )
            )
        ).all()
    )
    assert visible_codes == set(MVP_VISIBLE_BADGE_CODES)
    assert len(visible_codes) == 4
