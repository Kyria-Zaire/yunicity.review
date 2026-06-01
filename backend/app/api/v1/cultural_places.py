"""Cultural places public routes (WEB-MAP-03, WEB-PLACES-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cultural_place_constants import (
    CULTURAL_PLACE_LIST_LIMIT_DEFAULT,
    CULTURAL_PLACE_SORT_FEATURED,
)
from app.db.session import get_db
from app.schemas.cultural_place import (
    CulturalPlaceDetail,
    CulturalPlaceListResponse,
    CulturalPlaceStatsResponse,
)
from app.services.cultural_place_service import CulturalPlaceService, default_list_limit

router = APIRouter(prefix="/cultural-places", tags=["cultural-places"])


@router.get("/stats", response_model=CulturalPlaceStatsResponse)
async def cultural_places_stats(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> CulturalPlaceStatsResponse:
    return await CulturalPlaceService(session).get_city_stats(city=city)


@router.get("", response_model=CulturalPlaceListResponse)
async def list_cultural_places(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    featured: bool = Query(default=False),
    category: list[str] | None = Query(default=None),  # noqa: B008
    sort: str = Query(default=CULTURAL_PLACE_SORT_FEATURED),
    limit: int = Query(default=CULTURAL_PLACE_LIST_LIMIT_DEFAULT, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> CulturalPlaceListResponse:
    return await CulturalPlaceService(session).list_public(
        city=city,
        featured_only=featured,
        categories=category,
        sort=sort,
        limit=default_list_limit(limit),
        offset=offset,
    )


@router.get("/{slug}", response_model=CulturalPlaceDetail)
async def get_cultural_place(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> CulturalPlaceDetail:
    return await CulturalPlaceService(session).get_public_by_slug(city=city, slug=slug)
