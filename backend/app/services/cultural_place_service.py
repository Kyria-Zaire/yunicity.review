"""Cultural places business logic (WEB-MAP-03)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cultural_place_constants import (
    CULTURAL_PLACE_LIST_LIMIT_DEFAULT,
    CULTURAL_PLACE_LIST_LIMIT_MAX,
    CULTURAL_PLACE_MAP_LIMIT_DEFAULT,
    CULTURAL_PLACE_MAP_LIMIT_MAX,
)
from app.core.errors import AppError
from app.models.cultural_place import CulturalPlace
from app.repositories.cultural_place_repository import CulturalPlaceRepository
from app.schemas.cultural_place import (
    CulturalPlaceDetail,
    CulturalPlaceListItem,
    CulturalPlaceListResponse,
    CulturalPlaceNeighborhoodSummary,
    MapCulturalPlaceItem,
    MapCulturalPlaceListResponse,
)
from app.schemas.map_event import MapBboxResponse
from app.services.map_event_service import MapBbox


class CulturalPlaceService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = CulturalPlaceRepository(session)

    async def list_public(
        self,
        *,
        city: str,
        featured_only: bool,
        limit: int,
    ) -> CulturalPlaceListResponse:
        trimmed_city = city.strip()
        capped_limit = min(max(limit, 1), CULTURAL_PLACE_LIST_LIMIT_MAX)
        rows = await self._repo.list_for_city(
            city=trimmed_city,
            featured_only=featured_only,
            active_only=True,
            limit=capped_limit,
        )
        return CulturalPlaceListResponse(
            city=trimmed_city,
            items=[self._to_list_item(row) for row in rows],
            count=len(rows),
        )

    async def get_public_by_slug(self, *, city: str, slug: str) -> CulturalPlaceDetail:
        row = await self._repo.get_by_city_slug(
            city=city.strip(),
            slug=slug.strip().lower(),
            active_only=True,
        )
        if row is None:
            raise AppError(
                status_code=404,
                code="CULTURAL_PLACE_NOT_FOUND",
                detail="Lieu culturel introuvable.",
            )
        return self._to_detail(row)

    async def list_map_places(
        self,
        *,
        bbox: MapBbox,
        city: str,
        limit: int,
    ) -> MapCulturalPlaceListResponse:
        self._validate_bbox(bbox)
        trimmed_city = city.strip()
        capped_limit = min(max(limit, 1), CULTURAL_PLACE_MAP_LIMIT_MAX)
        rows = await self._repo.list_in_bbox(
            city=trimmed_city,
            lat_min=bbox.lat_min,
            lon_min=bbox.lon_min,
            lat_max=bbox.lat_max,
            lon_max=bbox.lon_max,
            active_only=True,
            limit=capped_limit,
        )
        return MapCulturalPlaceListResponse(
            city=trimmed_city,
            bbox=MapBboxResponse(
                lat_min=bbox.lat_min,
                lon_min=bbox.lon_min,
                lat_max=bbox.lat_max,
                lon_max=bbox.lon_max,
            ),
            count=len(rows),
            places=[self._to_map_item(row) for row in rows],
        )

    @staticmethod
    def _neighborhood_summary(row: CulturalPlace) -> CulturalPlaceNeighborhoodSummary | None:
        hood = row.neighborhood
        if hood is None:
            return None
        return CulturalPlaceNeighborhoodSummary(slug=hood.slug, display_name=hood.display_name)

    def _to_list_item(self, row: CulturalPlace) -> CulturalPlaceListItem:
        return CulturalPlaceListItem(
            id=row.id,
            slug=row.slug,
            name=row.name,
            short_description=row.short_description,
            city=row.city,
            address=row.address,
            category=row.category,
            latitude=row.latitude,
            longitude=row.longitude,
            image_url=row.image_url,
            image_alt=row.image_alt,
            source_name=row.source_name,
            image_credit=row.image_credit,
            neighborhood=self._neighborhood_summary(row),
        )

    def _to_detail(self, row: CulturalPlace) -> CulturalPlaceDetail:
        base = self._to_list_item(row)
        return CulturalPlaceDetail(
            **base.model_dump(),
            description=row.description,
            source_url=row.source_url,
            image_license=row.image_license,
            is_featured=row.is_featured,
        )

    def _to_map_item(self, row: CulturalPlace) -> MapCulturalPlaceItem:
        return MapCulturalPlaceItem(
            id=row.id,
            slug=row.slug,
            name=row.name,
            category=row.category,
            address=row.address,
            city=row.city,
            neighborhood=self._neighborhood_summary(row),
            latitude=row.latitude,
            longitude=row.longitude,
            image_url=row.image_url,
            image_alt=row.image_alt,
            source_name=row.source_name,
            image_credit=row.image_credit,
        )

    @staticmethod
    def _validate_bbox(bbox: MapBbox) -> None:
        if bbox.lat_min > bbox.lat_max or bbox.lon_min > bbox.lon_max:
            raise AppError(
                status_code=422,
                code="INVALID_BBOX",
                detail="La bounding box est invalide.",
            )


def default_list_limit(limit: int | None) -> int:
    if limit is None:
        return CULTURAL_PLACE_LIST_LIMIT_DEFAULT
    return limit


def default_map_limit(limit: int | None) -> int:
    if limit is None:
        return CULTURAL_PLACE_MAP_LIMIT_DEFAULT
    return limit
