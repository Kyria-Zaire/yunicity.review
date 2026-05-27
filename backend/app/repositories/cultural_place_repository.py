"""Cultural places repository (WEB-MAP-03)."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cultural_place import CulturalPlace


class CulturalPlaceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _base_stmt(self, *, active_only: bool) -> select[tuple[CulturalPlace]]:
        stmt = select(CulturalPlace).options(selectinload(CulturalPlace.neighborhood))
        if active_only:
            stmt = stmt.where(CulturalPlace.is_active.is_(True))
        return stmt

    async def list_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
        limit: int,
    ) -> list[CulturalPlace]:
        stmt = (
            self._base_stmt(active_only=active_only)
            .where(CulturalPlace.city == city)
            .order_by(
                CulturalPlace.featured_priority.desc(),
                CulturalPlace.is_featured.desc(),
                CulturalPlace.name.asc(),
            )
            .limit(limit)
        )
        if featured_only:
            stmt = stmt.where(CulturalPlace.is_featured.is_(True))
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def count_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
    ) -> int:
        stmt = select(func.count()).select_from(CulturalPlace).where(CulturalPlace.city == city)
        if active_only:
            stmt = stmt.where(CulturalPlace.is_active.is_(True))
        if featured_only:
            stmt = stmt.where(CulturalPlace.is_featured.is_(True))
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def get_by_city_slug(
        self,
        *,
        city: str,
        slug: str,
        active_only: bool,
    ) -> CulturalPlace | None:
        stmt = (
            self._base_stmt(active_only=active_only)
            .where(CulturalPlace.city == city, CulturalPlace.slug == slug)
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_in_bbox(
        self,
        *,
        city: str,
        lat_min: float,
        lon_min: float,
        lat_max: float,
        lon_max: float,
        active_only: bool,
        limit: int,
    ) -> list[CulturalPlace]:
        stmt = (
            self._base_stmt(active_only=active_only)
            .where(
                CulturalPlace.city == city,
                CulturalPlace.latitude >= lat_min,
                CulturalPlace.latitude <= lat_max,
                CulturalPlace.longitude >= lon_min,
                CulturalPlace.longitude <= lon_max,
            )
            .order_by(CulturalPlace.name.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def upsert_seed_row(self, row: CulturalPlace) -> None:
        existing = await self.get_by_city_slug(
            city=row.city,
            slug=row.slug,
            active_only=False,
        )
        if existing is None:
            self._session.add(row)
            return
        for field in (
            "name",
            "short_description",
            "description",
            "neighborhood_id",
            "address",
            "latitude",
            "longitude",
            "category",
            "image_url",
            "hero_image_url",
            "gallery_images",
            "thumbnail_image_url",
            "image_alt",
            "source_name",
            "source_url",
            "photo_credit",
            "image_credit",
            "image_source",
            "image_license",
            "editorial_excerpt",
            "image_blurhash",
            "featured_priority",
            "is_featured",
            "is_active",
        ):
            setattr(existing, field, getattr(row, field))
