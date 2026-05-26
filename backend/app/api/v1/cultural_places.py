"""Cultural places public routes (WEB-MAP-03)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cultural_place_constants import CULTURAL_PLACE_LIST_LIMIT_DEFAULT
from app.db.session import get_db
from app.schemas.cultural_place import CulturalPlaceDetail, CulturalPlaceListResponse
from app.services.cultural_place_service import CulturalPlaceService, default_list_limit

router = APIRouter(prefix="/cultural-places", tags=["cultural-places"])


@router.get("", response_model=CulturalPlaceListResponse)
async def list_cultural_places(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    featured: bool = Query(default=False),
    limit: int = Query(default=CULTURAL_PLACE_LIST_LIMIT_DEFAULT, ge=1, le=50),
) -> CulturalPlaceListResponse:
    return await CulturalPlaceService(session).list_public(
        city=city,
        featured_only=featured,
        limit=default_list_limit(limit),
    )


@router.get("/{slug}", response_model=CulturalPlaceDetail)
async def get_cultural_place(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> CulturalPlaceDetail:
    return await CulturalPlaceService(session).get_public_by_slug(city=city, slug=slug)
