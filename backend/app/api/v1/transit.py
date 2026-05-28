"""Grand Reims transit routes (WEB-MAP-02)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.transit_constants import (
    TRANSIT_DEFAULT_LAT,
    TRANSIT_DEFAULT_LON,
    TRANSIT_NEARBY_MAX_MINUTES_DEFAULT,
    TRANSIT_NEARBY_MAX_MINUTES_MAX,
    TRANSIT_NEARBY_RADIUS_DEFAULT_M,
    TRANSIT_NEARBY_RADIUS_MAX_M,
    TRANSIT_NEARBY_STOPS_LIMIT,
)
from app.db.session import get_db
from app.schemas.transit import TransitNearbyResponse
from app.services.transit_service import TransitNearbyQuery, TransitService

router = APIRouter(prefix="/transit", tags=["transit"])


@router.get("/nearby", response_model=TransitNearbyResponse)
async def transit_nearby(
    session: Annotated[AsyncSession, Depends(get_db)],
    lat: float = Query(ge=-90, le=90, default=TRANSIT_DEFAULT_LAT),
    lon: float = Query(ge=-180, le=180, default=TRANSIT_DEFAULT_LON),
    city: str = Query(default="Reims", max_length=128),
    radius_meters: int = Query(
        default=TRANSIT_NEARBY_RADIUS_DEFAULT_M,
        ge=50,
        le=TRANSIT_NEARBY_RADIUS_MAX_M,
    ),
    limit: int = Query(default=TRANSIT_NEARBY_STOPS_LIMIT, ge=1, le=10),
    max_minutes: int = Query(
        default=TRANSIT_NEARBY_MAX_MINUTES_DEFAULT,
        ge=1,
        le=TRANSIT_NEARBY_MAX_MINUTES_MAX,
    ),
) -> TransitNearbyResponse:
    """Prochains passages près d'un point carte (lat/lon) — pas de persistance position."""
    return await TransitService(session).get_nearby(
        TransitNearbyQuery(
            lat=lat,
            lon=lon,
            city=city,
            radius_meters=radius_meters,
            limit=limit,
            max_minutes=max_minutes,
        )
    )
