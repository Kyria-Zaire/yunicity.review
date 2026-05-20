"""Public neighborhood catalog routes (TICKET-602)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.neighborhood_constants import (
    NEIGHBORHOOD_LIST_PAGE_SIZE_DEFAULT,
    NEIGHBORHOOD_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.schemas.neighborhood import (
    NeighborhoodContextResponse,
    NeighborhoodListResponse,
    NeighborhoodResponse,
)
from app.services.neighborhood_context_service import NeighborhoodContextService
from app.services.neighborhood_service import NeighborhoodService

router = APIRouter(prefix="/neighborhoods", tags=["neighborhoods"])


@router.get("", response_model=NeighborhoodListResponse)
async def list_neighborhoods(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1, description="Ville (ex. Reims)"),
    featured_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=NEIGHBORHOOD_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=NEIGHBORHOOD_LIST_PAGE_SIZE_MAX,
    ),
) -> NeighborhoodListResponse:
    return await NeighborhoodService(session).list_public(
        city=city,
        featured_only=featured_only,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}/context", response_model=NeighborhoodContextResponse)
async def get_neighborhood_context(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1, description="Ville (ex. Reims)"),
) -> NeighborhoodContextResponse:
    return await NeighborhoodContextService(session).get_context(city=city, slug=slug)


@router.get("/{slug}", response_model=NeighborhoodResponse)
async def get_neighborhood(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1, description="Ville (ex. Reims)"),
) -> NeighborhoodResponse:
    return await NeighborhoodService(session).get_public_by_slug(city=city, slug=slug)
