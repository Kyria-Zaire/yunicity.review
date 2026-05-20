"""Idempotent seed for local stamp definitions (TICKET-504)."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.local_stamp import StampDefinition

MVP_STAMP_DEFINITION_SEED: tuple[dict[str, object], ...] = (
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000001"),
        "slug": "first_local_place",
        "title": "Premier lieu découvert",
        "description": "Votre première expérience chez un partenaire local.",
        "icon": "place",
        "trigger_type": "first_redemption_per_organization",
        "city_scoped": True,
    },
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000002"),
        "slug": "first_scan_validated",
        "title": "Premier passage validé",
        "description": "Votre première offre utilisée sur le territoire.",
        "icon": "scan",
        "trigger_type": "first_scan_redemption",
        "city_scoped": True,
    },
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000003"),
        "slug": "first_flash_memory",
        "title": "Souvenir flash",
        "description": "Une offre locale limitée dans le temps, vécue en vrai.",
        "icon": "flash",
        "trigger_type": "first_flash_redemption",
        "city_scoped": True,
    },
)


async def seed_stamp_definitions(session: AsyncSession) -> None:
    for row in MVP_STAMP_DEFINITION_SEED:
        slug = str(row["slug"])
        result = await session.execute(
            select(StampDefinition.id).where(StampDefinition.slug == slug).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            continue
        stamp_id = row["id"]
        assert isinstance(stamp_id, uuid.UUID)
        session.add(
            StampDefinition(
                id=stamp_id,
                slug=slug,
                title=str(row["title"]),
                description=str(row["description"]) if row.get("description") else None,
                icon=str(row["icon"]),
                trigger_type=str(row["trigger_type"]),
                city_scoped=bool(row["city_scoped"]),
                is_active=True,
            )
        )
    await session.flush()
