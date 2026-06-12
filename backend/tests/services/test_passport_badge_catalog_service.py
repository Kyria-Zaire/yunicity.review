"""PassportBadgeCatalogService tests (PASSPORT-03A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator

import pytest
from app.core.passport_badge_constants import (
    MVP_SECRET_BADGE_CODES,
    PassportBadgeCode,
    PassportBadgeVisibility,
)
from app.db.base import Base
from app.db.seeds.passport_badges import seed_passport_badges
from app.db.session import dispose_db, get_engine, init_db
from app.models.passport_badge import PassportBadge, UserPassportBadge
from app.models.user import User
from app.services.passport_badge_catalog_service import PassportBadgeCatalogService
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def badge_catalog_db(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[tuple[AsyncSession, uuid.UUID], None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip passport badge catalog tests")
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
            email=f"badge-catalog-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            full_name="Badge Catalog Tester",
            city="Reims",
        )
        session.add(user)
        await session.commit()
        yield session, user.id

    await dispose_db()
    get_settings.cache_clear()


def _service(session: AsyncSession) -> PassportBadgeCatalogService:
    return PassportBadgeCatalogService(session)


async def _seed_catalog(session: AsyncSession) -> None:
    await seed_passport_badges(session)
    await session.commit()


async def test_visible_catalog_excludes_secret_badges(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _seed_catalog(session)

    badges = await _service(session).list_active_badges(include_secret=False)
    codes = {badge.code for badge in badges}

    assert PassportBadgeCode.FANTOME_DES_HALLES.value not in codes
    assert PassportBadgeCode.TOUJOURS_PRESENT.value not in codes
    assert len(badges) == 4
    assert all(badge.visibility == PassportBadgeVisibility.VISIBLE.value for badge in badges)


async def test_admin_catalog_can_include_secret_badges(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _seed_catalog(session)

    badges = await _service(session).list_active_badges(include_secret=True)
    codes = {badge.code for badge in badges}

    assert codes >= set(MVP_SECRET_BADGE_CODES)
    assert len(badges) == 6


async def test_badges_are_ordered_by_display_order(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _seed_catalog(session)

    badges = await _service(session).list_active_badges(include_secret=True)
    orders = [badge.display_order for badge in badges]
    assert orders == sorted(orders)


async def test_get_badge_by_code_returns_expected_badge(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _seed_catalog(session)

    badge = await _service(session).get_badge_by_code(
        PassportBadgeCode.SOUTIEN_LOCAL.value
    )
    assert badge is not None
    assert badge.name == "Soutien local"
    assert badge.family == "citizen"


async def test_ensure_mvp_badges_seeds_catalog(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _service(session).ensure_mvp_badges()
    await session.commit()

    count = len(await _service(session).list_active_badges(include_secret=True))
    assert count == 6


async def test_secret_badges_exist_but_are_not_public_by_default(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, _ = badge_catalog_db
    await _seed_catalog(session)

    secret = await session.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.FANTOME_DES_HALLES.value
        )
    )
    assert secret is not None
    assert secret.visibility == PassportBadgeVisibility.SECRET.value

    public = await _service(session).list_active_badges(include_secret=False)
    assert secret.code not in {badge.code for badge in public}


async def test_user_badge_unique_constraint(
    badge_catalog_db: tuple[AsyncSession, uuid.UUID],
) -> None:
    session, user_id = badge_catalog_db
    await _seed_catalog(session)

    badge = await session.scalar(
        select(PassportBadge).where(
            PassportBadge.code == PassportBadgeCode.EXPLORATEUR_REIMS.value
        )
    )
    assert badge is not None

    session.add(UserPassportBadge(user_id=user_id, badge_id=badge.id))
    await session.commit()

    session.add(UserPassportBadge(user_id=user_id, badge_id=badge.id))
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()
