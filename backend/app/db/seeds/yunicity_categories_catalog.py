"""Production-safe Yunicity categories catalog seed (FEATURE-PROD-DATA-05 / 05B)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seeds.yunicity_categories import (
    YUNICITY_CATEGORY_SEED,
    seed_yunicity_categories,
)
from app.models.yunicity_category import YunicityCategory

logger = logging.getLogger(__name__)

YUNICITY_OFFICIAL_CATEGORY_COUNT = len(YUNICITY_CATEGORY_SEED)


@dataclass(frozen=True)
class YunicityCategoriesCatalogSeedResult:
    categories_created: int
    categories_total: int


async def _count_categories(session: AsyncSession) -> int:
    return (await session.execute(select(func.count()).select_from(YunicityCategory))).scalar_one()


async def seed_yunicity_categories_catalog(
    session: AsyncSession,
) -> YunicityCategoriesCatalogSeedResult:
    """Idempotent catalog: 12 official Yunicity categories."""
    before_count = await _count_categories(session)
    categories_created = await seed_yunicity_categories(session)
    total = await _count_categories(session)

    if total != YUNICITY_OFFICIAL_CATEGORY_COUNT:
        raise RuntimeError(
            f"Yunicity category catalog incomplete: expected "
            f"{YUNICITY_OFFICIAL_CATEGORY_COUNT}, got {total} "
            f"(before={before_count}, categories_created={categories_created})"
        )

    result = YunicityCategoriesCatalogSeedResult(
        categories_created=categories_created,
        categories_total=total,
    )
    logger.info(
        "yunicity_categories_catalog_seed_completed",
        extra={
            "categories_created": result.categories_created,
            "categories_total": result.categories_total,
        },
    )
    return result
