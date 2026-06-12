"""Idempotent seed for Passport V2 badge catalog (PASSPORT-03A)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_badge_constants import MVP_PASSPORT_BADGE_SEED
from app.models.passport_badge import PassportBadge


def _apply_badge_fields(badge: PassportBadge, row: dict[str, Any]) -> None:
    badge.name = str(row["name"])
    badge.description = str(row["description"])
    badge.family = str(row["family"])
    badge.visibility = str(row["visibility"])
    badge.rarity = str(row["rarity"])
    badge.reputation_reward = int(row["reputation_reward"])
    badge.ym_reward = int(row["ym_reward"])
    badge.display_order = int(row["display_order"])
    badge.is_active = True


async def seed_passport_badges(session: AsyncSession) -> None:
    """Upsert MVP Reims badges — relançable, never deletes existing rows."""
    for row in MVP_PASSPORT_BADGE_SEED:
        code = str(row["code"])
        existing = await session.scalar(
            select(PassportBadge).where(PassportBadge.code == code).limit(1)
        )
        if existing is not None:
            _apply_badge_fields(existing, row)
            continue
        badge = PassportBadge(code=code)
        _apply_badge_fields(badge, row)
        session.add(badge)
    await session.flush()
