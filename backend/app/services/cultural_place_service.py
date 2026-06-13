"""Cultural places business logic (WEB-MAP-03, WEB-SEARCH-02B.1)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cultural_place_constants import (
    CULTURAL_PLACE_LIST_LIMIT_DEFAULT,
    CULTURAL_PLACE_LIST_LIMIT_MAX,
    CULTURAL_PLACE_MAP_LIMIT_DEFAULT,
    CULTURAL_PLACE_MAP_LIMIT_MAX,
    CULTURAL_PLACE_SORT_FEATURED,
    CULTURAL_PLACE_SORT_NAME,
    CULTURAL_PLACE_SORT_RECENT,
)
from app.core.errors import AppError
from app.models.cultural_place import CulturalPlace
from app.repositories.cultural_place_repository import CulturalPlaceRepository
from app.schemas.cultural_place import (
    CulturalGalleryImage,
    CulturalPlaceDetail,
    CulturalPlaceListItem,
    CulturalPlaceListResponse,
    CulturalPlaceMediaFields,
    CulturalPlaceNeighborhoodSummary,
    CulturalPlaceStatsResponse,
    MapCulturalPlaceItem,
    MapCulturalPlaceListResponse,
)
from app.schemas.map_event import MapBboxResponse
from app.services.cultural_media import gallery_for_api, normalize_cultural_media
from app.services.map_event_service import MapBbox


class CulturalPlaceService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = CulturalPlaceRepository(session)

    async def list_public(
        self,
        *,
        city: str,
        featured_only: bool,
        categories: list[str] | None,
        sort: str,
        limit: int,
        offset: int,
    ) -> CulturalPlaceListResponse:
        trimmed_city = city.strip()
        capped_limit = min(max(limit, 1), CULTURAL_PLACE_LIST_LIMIT_MAX)
        safe_offset = max(offset, 0)
        resolved_sort = self._resolve_sort(sort)
        normalized_categories = self._normalize_categories(categories)
        total = await self._repo.count_for_city(
            city=trimmed_city,
            featured_only=featured_only,
            active_only=True,
            categories=normalized_categories,
        )
        rows = await self._repo.list_for_city(
            city=trimmed_city,
            featured_only=featured_only,
            active_only=True,
            categories=normalized_categories,
            sort=resolved_sort,
            limit=capped_limit,
            offset=safe_offset,
        )
        return CulturalPlaceListResponse(
            city=trimmed_city,
            items=[self._to_list_item(row) for row in rows],
            count=len(rows),
            total=total,
            offset=safe_offset,
            limit=capped_limit,
        )

    async def get_city_stats(self, *, city: str) -> CulturalPlaceStatsResponse:
        trimmed_city = city.strip()
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        total_places = await self._repo.count_for_city(
            city=trimmed_city,
            featured_only=False,
            active_only=True,
        )
        new_this_month = await self._repo.count_new_since(
            city=trimmed_city,
            since=month_start,
            active_only=True,
        )
        category_count = await self._repo.count_distinct_categories(
            city=trimmed_city,
            active_only=True,
        )
        return CulturalPlaceStatsResponse(
            city=trimmed_city,
            total_places=total_places,
            new_this_month=new_this_month,
            category_count=category_count,
        )

    @staticmethod
    def _resolve_sort(sort: str) -> str:
        if sort == CULTURAL_PLACE_SORT_NAME:
            return CULTURAL_PLACE_SORT_NAME
        if sort == CULTURAL_PLACE_SORT_RECENT:
            return CULTURAL_PLACE_SORT_RECENT
        return CULTURAL_PLACE_SORT_FEATURED

    @staticmethod
    def _normalize_categories(categories: list[str] | None) -> list[str] | None:
        if not categories:
            return None
        cleaned = [item.strip().lower() for item in categories if item.strip()]
        return cleaned or None

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
        categories: list[str] | None = None,
    ) -> MapCulturalPlaceListResponse:
        self._validate_bbox(bbox)
        trimmed_city = city.strip()
        capped_limit = min(max(limit, 1), CULTURAL_PLACE_MAP_LIMIT_MAX)
        normalized_categories = self._normalize_categories(categories)
        rows = await self._repo.list_in_bbox(
            city=trimmed_city,
            lat_min=bbox.lat_min,
            lon_min=bbox.lon_min,
            lat_max=bbox.lat_max,
            lon_max=bbox.lon_max,
            active_only=True,
            categories=normalized_categories,
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

    @staticmethod
    def _media_fields(row: CulturalPlace) -> CulturalPlaceMediaFields:
        normalized = normalize_cultural_media(
            image_url=row.image_url,
            hero_image_url=row.hero_image_url,
            thumbnail_image_url=row.thumbnail_image_url,
            gallery_images=row.gallery_images,
            photo_credit=row.photo_credit,
            image_credit=row.image_credit,
            image_source=row.image_source,
            editorial_excerpt=row.editorial_excerpt,
            image_blurhash=row.image_blurhash,
        )
        gallery = [
            CulturalGalleryImage.model_validate(item)
            for item in gallery_for_api(normalized.gallery_images)
        ]
        return CulturalPlaceMediaFields(
            image_url=normalized.image_url,
            hero_image_url=normalized.hero_image_url,
            thumbnail_image_url=normalized.thumbnail_image_url,
            gallery_images=gallery,
            editorial_excerpt=normalized.editorial_excerpt,
            photo_credit=normalized.photo_credit,
            image_source=normalized.image_source,
        )

    def _to_list_item(self, row: CulturalPlace) -> CulturalPlaceListItem:
        media = self._media_fields(row)
        normalized = normalize_cultural_media(
            image_url=row.image_url,
            image_credit=row.image_credit,
            photo_credit=row.photo_credit,
        )
        return CulturalPlaceListItem(
            **media.model_dump(),
            id=row.id,
            slug=row.slug,
            name=row.name,
            short_description=row.short_description,
            city=row.city,
            address=row.address,
            category=row.category,
            latitude=row.latitude,
            longitude=row.longitude,
            image_alt=row.image_alt,
            source_name=row.source_name,
            image_credit=normalized.image_credit,
            neighborhood=self._neighborhood_summary(row),
            is_featured=row.is_featured,
            created_at=row.created_at.isoformat(),
        )

    def _to_detail(self, row: CulturalPlace) -> CulturalPlaceDetail:
        base = self._to_list_item(row)
        return CulturalPlaceDetail(
            **base.model_dump(),
            description=row.description,
            source_url=row.source_url,
            image_license=row.image_license,
            featured_priority=row.featured_priority,
            image_blurhash=row.image_blurhash,
        )

    def _to_map_item(self, row: CulturalPlace) -> MapCulturalPlaceItem:
        media = self._media_fields(row)
        normalized = normalize_cultural_media(
            image_url=row.image_url,
            image_credit=row.image_credit,
            photo_credit=row.photo_credit,
        )
        return MapCulturalPlaceItem(
            **media.model_dump(),
            id=row.id,
            slug=row.slug,
            name=row.name,
            category=row.category,
            address=row.address,
            city=row.city,
            neighborhood=self._neighborhood_summary(row),
            latitude=row.latitude,
            longitude=row.longitude,
            image_alt=row.image_alt,
            source_name=row.source_name,
            image_credit=normalized.image_credit,
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
