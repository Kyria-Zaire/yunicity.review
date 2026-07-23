"""Neighborhood catalog persistence (TICKET-602)."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodCommunityTagAssignment,
    NeighborhoodLandmark,
)


class NeighborhoodRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, neighborhood_id: uuid.UUID) -> Neighborhood | None:
        result = await self._session.execute(
            select(Neighborhood).where(Neighborhood.id == neighborhood_id)
        )
        return result.scalar_one_or_none()

    async def get_by_city_slug(
        self,
        *,
        city: str,
        slug: str,
        active_only: bool = False,
    ) -> Neighborhood | None:
        stmt = select(Neighborhood).where(
            func.lower(Neighborhood.city) == city.strip().lower(),
            Neighborhood.slug == slug.strip().lower(),
        )
        if active_only:
            stmt = stmt.where(Neighborhood.is_active.is_(True))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_city_slug_with_editorial(
        self,
        *,
        city: str,
        slug: str,
        active_only: bool = False,
    ) -> Neighborhood | None:
        stmt = (
            select(Neighborhood)
            .where(
                func.lower(Neighborhood.city) == city.strip().lower(),
                Neighborhood.slug == slug.strip().lower(),
            )
            .options(
                selectinload(Neighborhood.aliases),
                selectinload(Neighborhood.mood_assignments),
                selectinload(Neighborhood.timeline_entries),
                selectinload(Neighborhood.community_tag_assignments).selectinload(
                    NeighborhoodCommunityTagAssignment.tag
                ),
                selectinload(Neighborhood.landmarks).selectinload(
                    NeighborhoodLandmark.cultural_place
                ),
            )
        )
        if active_only:
            stmt = stmt.where(Neighborhood.is_active.is_(True))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
        limit: int,
        offset: int,
    ) -> list[Neighborhood]:
        stmt = select(Neighborhood).where(
            func.lower(Neighborhood.city) == city.strip().lower(),
        )
        if active_only:
            stmt = stmt.where(Neighborhood.is_active.is_(True))
        if featured_only:
            stmt = stmt.where(Neighborhood.is_featured.is_(True))
        stmt = (
            stmt.order_by(
                Neighborhood.is_featured.desc(),
                Neighborhood.display_name.asc(),
            )
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(Neighborhood)
            .where(
                func.lower(Neighborhood.city) == city.strip().lower(),
            )
        )
        if active_only:
            stmt = stmt.where(Neighborhood.is_active.is_(True))
        if featured_only:
            stmt = stmt.where(Neighborhood.is_featured.is_(True))
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def add(self, neighborhood: Neighborhood) -> Neighborhood:
        self._session.add(neighborhood)
        await self._session.flush()
        return neighborhood
