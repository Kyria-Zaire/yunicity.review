"""Production category catalog seed tests (FEATURE-PROD-DATA-05 / 05B)."""

from __future__ import annotations

import logging
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.db.seeds.yunicity_categories import YUNICITY_CATEGORY_SEED, seed_yunicity_categories
from app.db.seeds.yunicity_categories_catalog import (
    YUNICITY_OFFICIAL_CATEGORY_COUNT,
    seed_yunicity_categories_catalog,
)
from app.db.session import get_engine
from app.models.yunicity_category import YunicityCategory
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark_integration = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.asyncio
async def test_yunicity_categories_seed_logging_does_not_crash() -> None:
    """Avoid LogRecord reserved keys in logging extra."""
    logging.basicConfig(level=logging.INFO, force=True)

    async def mock_execute(_stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        return result

    session = AsyncMock()
    session.execute = mock_execute
    session.add = MagicMock()
    session.flush = AsyncMock()

    created = await seed_yunicity_categories(session)

    assert created == len(YUNICITY_CATEGORY_SEED)
    assert session.add.call_count == len(YUNICITY_CATEGORY_SEED)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_category_catalog_seed_creates_twelve() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip category catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await session.execute(delete(YunicityCategory))
        await session.flush()
        result = await seed_yunicity_categories_catalog(session)
        await session.commit()

        count = (await session.execute(select(func.count()).select_from(YunicityCategory))).scalar_one()

    assert result.categories_total == YUNICITY_OFFICIAL_CATEGORY_COUNT == 12
    assert count == 12
    assert result.categories_created == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_category_catalog_seed_idempotent() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip category catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await session.execute(delete(YunicityCategory))
        await session.flush()
        first = await seed_yunicity_categories_catalog(session)
        await session.commit()
        second = await seed_yunicity_categories_catalog(session)
        await session.commit()

        count = (await session.execute(select(func.count()).select_from(YunicityCategory))).scalar_one()

    assert first.categories_created == 12
    assert second.categories_created == 0
    assert count == 12


@pytest.mark.asyncio
@pytest.mark.integration
async def test_prod_category_catalog_seed_fields() -> None:
    engine = get_engine()
    if engine is None:
        pytest.skip("DATABASE_URL not set — skip category catalog integration tests")
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await session.execute(delete(YunicityCategory))
        await session.flush()
        await seed_yunicity_categories_catalog(session)
        await session.commit()
        rows = (
            await session.execute(
                select(YunicityCategory).order_by(YunicityCategory.display_order)
            )
        ).scalars().all()

    assert len(rows) == 12
    assert rows[0].slug == "restaurant"
    assert rows[0].name == "Restaurant"
    assert rows[0].icon == "utensils-crossed"
    assert rows[0].is_active is True
    assert rows[-1].slug == "services"
    slugs = {row.slug for row in rows}
    assert slugs == {row["slug"] for row in YUNICITY_CATEGORY_SEED}
