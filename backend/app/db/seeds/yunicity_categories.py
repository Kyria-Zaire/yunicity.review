"""Idempotent Yunicity official categories seed (FEATURE-PROD-DATA-05 / 05B)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.yunicity_category import YunicityCategory

logger = logging.getLogger(__name__)

YUNICITY_CATEGORY_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000001"),
        "slug": "restaurant",
        "name": "Restaurant",
        "short_description": "Restauration, tables et cuisine locale.",
        "icon": "utensils-crossed",
        "display_order": 10,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000002"),
        "slug": "bar",
        "name": "Bar",
        "short_description": "Bars, brasseries et pauses conviviales.",
        "icon": "wine",
        "display_order": 20,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000003"),
        "slug": "culture",
        "name": "Culture",
        "short_description": "Lieux culturels, spectacles et patrimoine.",
        "icon": "landmark",
        "display_order": 30,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000004"),
        "slug": "sport",
        "name": "Sport",
        "short_description": "Clubs, salles et activités sportives.",
        "icon": "dumbbell",
        "display_order": 40,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000005"),
        "slug": "association",
        "name": "Association",
        "short_description": "Associations et vie associative locale.",
        "icon": "users",
        "display_order": 50,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000006"),
        "slug": "commerce",
        "name": "Commerce",
        "short_description": "Commerces de proximité et boutiques.",
        "icon": "store",
        "display_order": 60,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000007"),
        "slug": "beaute",
        "name": "Beauté",
        "short_description": "Beauté, bien-être et soins.",
        "icon": "sparkles",
        "display_order": 70,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000008"),
        "slug": "sante",
        "name": "Santé",
        "short_description": "Santé et professions médicales.",
        "icon": "heart-pulse",
        "display_order": 80,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000009"),
        "slug": "education",
        "name": "Éducation",
        "short_description": "Écoles, formation et apprentissage.",
        "icon": "graduation-cap",
        "display_order": 90,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000010"),
        "slug": "vie-nocturne",
        "name": "Vie nocturne",
        "short_description": "Soirées, clubs et sorties nocturnes.",
        "icon": "moon",
        "display_order": 100,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000011"),
        "slug": "famille",
        "name": "Famille",
        "short_description": "Activités et services pour les familles.",
        "icon": "baby",
        "display_order": 110,
    },
    {
        "id": uuid.UUID("d6020000-0000-4000-8000-000000000012"),
        "slug": "services",
        "name": "Services",
        "short_description": "Services du quotidien et artisans.",
        "icon": "wrench",
        "display_order": 120,
    },
)


async def seed_yunicity_categories(session: AsyncSession) -> int:
    created = 0
    for row in YUNICITY_CATEGORY_SEED:
        slug = str(row["slug"])
        result = await session.execute(
            select(YunicityCategory.id).where(YunicityCategory.slug == slug).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            continue
        category_id = row["id"]
        assert isinstance(category_id, uuid.UUID)
        session.add(
            YunicityCategory(
                id=category_id,
                slug=slug,
                name=str(row["name"]),
                short_description=str(row["short_description"])
                if row.get("short_description")
                else None,
                icon=str(row["icon"]),
                display_order=int(row["display_order"]),
                is_active=True,
            )
        )
        created += 1
    await session.flush()
    logger.info(
        "yunicity_categories_seed_completed",
        extra={"categories_created": created},
    )
    return created
