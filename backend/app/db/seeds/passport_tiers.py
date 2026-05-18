"""Idempotent seed for passport tier catalog (TICKET-302/303)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_constants import MVP_PASSPORT_TIER_SEED, PassportTierCode
from app.models.passport import PassportTier


async def seed_passport_tiers(session: AsyncSession) -> None:
    for row in MVP_PASSPORT_TIER_SEED:
        code = str(row["code"])
        result = await session.execute(
            select(PassportTier.id).where(PassportTier.code == code).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            continue
        flags = row["flags"]
        display_order = row["display_order"]
        session.add(
            PassportTier(
                code=PassportTierCode(code),
                name=str(row["name"]),
                display_order=int(display_order) if isinstance(display_order, int) else 0,
                is_publicly_visible=bool(row["is_publicly_visible"]),
                flags=dict(flags) if isinstance(flags, dict) else {},
            )
        )
    await session.flush()
