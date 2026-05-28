"""Cultural places repository (WEB-MAP-03)."""

from __future__ import annotations

import uuid
from datetime import datetime

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

    def _city_filters(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
        categories: list[str] | None,
    ) -> list:
        filters = [CulturalPlace.city == city]
        if active_only:
            filters.append(CulturalPlace.is_active.is_(True))
        if featured_only:
            filters.append(CulturalPlace.is_featured.is_(True))
        if categories:
            filters.append(CulturalPlace.category.in_(categories))
        return filters

    @staticmethod
    def _order_for_sort(sort: str):
        if sort == "name":
            return (CulturalPlace.name.asc(),)
        if sort == "recent":
            return (CulturalPlace.created_at.desc(), CulturalPlace.name.asc())
        return (
            CulturalPlace.featured_priority.desc(),
            CulturalPlace.is_featured.desc(),
            CulturalPlace.name.asc(),
        )

    async def list_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
        categories: list[str] | None,
        sort: str,
        limit: int,
        offset: int,
    ) -> list[CulturalPlace]:
        stmt = (
            self._base_stmt(active_only=active_only)
            .where(*self._city_filters(
                city=city,
                featured_only=featured_only,
                active_only=active_only,
                categories=categories,
            ))
            .order_by(*self._order_for_sort(sort))
            .offset(max(offset, 0))
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def count_for_city(
        self,
        *,
        city: str,
        featured_only: bool,
        active_only: bool,
        categories: list[str] | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(CulturalPlace).where(
            *self._city_filters(
                city=city,
                featured_only=featured_only,
                active_only=active_only,
                categories=categories,
            ),
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def count_new_since(
        self,
        *,
        city: str,
        since: datetime,
        active_only: bool,
    ) -> int:
        stmt = select(func.count()).select_from(CulturalPlace).where(
            CulturalPlace.city == city,
            CulturalPlace.created_at >= since,
        )
        if active_only:
            stmt = stmt.where(CulturalPlace.is_active.is_(True))
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def count_distinct_categories(
        self,
        *,
        city: str,
        active_only: bool,
    ) -> int:
        stmt = select(func.count(func.distinct(CulturalPlace.category))).where(
            CulturalPlace.city == city,
        )
        if active_only:
            stmt = stmt.where(CulturalPlace.is_active.is_(True))
        result = await self._session.execute(stmt)
        return int(result.scalar_one() or 0)

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
