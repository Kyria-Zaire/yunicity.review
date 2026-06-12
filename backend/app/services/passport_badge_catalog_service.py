"""Passport badge catalog read service (PASSPORT-03A).

User badge attribution: PASSPORT-03B (`passport_badge_earning_service.py`).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_badge_constants import PassportBadgeVisibility
from app.db.seeds.passport_badges import seed_passport_badges
from app.models.passport_badge import PassportBadge


class PassportBadgeCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active_badges(
        self,
        *,
        include_secret: bool = False,
    ) -> list[PassportBadge]:
        stmt = (
            select(PassportBadge)
            .where(PassportBadge.is_active.is_(True))
            .order_by(PassportBadge.display_order.asc(), PassportBadge.name.asc())
        )
        if not include_secret:
            stmt = stmt.where(
                PassportBadge.visibility == PassportBadgeVisibility.VISIBLE.value
            )
        return list((await self._session.execute(stmt)).scalars().all())

    async def get_badge_by_code(self, code: str) -> PassportBadge | None:
        result = await self._session.scalar(
            select(PassportBadge).where(PassportBadge.code == code).limit(1)
        )
        return result

    async def ensure_mvp_badges(self) -> None:
        await seed_passport_badges(self._session)
