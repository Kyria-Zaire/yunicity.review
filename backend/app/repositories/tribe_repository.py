"""Tribe persistence (TICKET-A.2)."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tribe_constants import TribeVisibility
from app.models.tribe import Tribe


class TribeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, tribe_id: uuid.UUID) -> Tribe | None:
        result = await self._session.execute(select(Tribe).where(Tribe.id == tribe_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, city: str, slug: str) -> Tribe | None:
        result = await self._session.execute(
            select(Tribe).where(
                Tribe.city == city,
                Tribe.slug == slug,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, tribe: Tribe) -> Tribe:
        self._session.add(tribe)
        await self._session.flush()
        return tribe

    async def list_public(
        self,
        *,
        city: str,
        featured_only: bool,
        offset: int,
        limit: int,
    ) -> tuple[list[Tribe], int]:
        base = select(Tribe).where(
            Tribe.city == city,
            Tribe.archived_at.is_(None),
            Tribe.visibility == TribeVisibility.PUBLIC.value,
        )
        if featured_only:
            base = base.where(Tribe.is_featured.is_(True))
        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())
        rows = await self._session.execute(
            base.order_by(Tribe.name.asc()).offset(offset).limit(limit)
        )
        return list(rows.scalars().all()), total
