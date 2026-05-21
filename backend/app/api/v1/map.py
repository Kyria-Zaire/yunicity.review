"""Event map routes (FEATURE-D / TICKET-D.3)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_optional
from app.core.map_constants import (
    MAP_EVENTS_LIMIT_DEFAULT,
    MAP_EVENTS_LIMIT_MAX,
    MAP_RATE_LIMIT,
    MAP_RATE_WINDOW_SECONDS,
)
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.map_event import MapEventListResponse
from app.services.map_event_service import MapBbox, MapEventService, default_map_limit

router = APIRouter(prefix="/map", tags=["map"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.get("/events", response_model=MapEventListResponse)
async def list_map_events(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    lat_min: float = Query(ge=-90, le=90),
    lon_min: float = Query(ge=-180, le=180),
    lat_max: float = Query(ge=-90, le=90),
    lon_max: float = Query(ge=-180, le=180),
    city: str | None = Query(default=None, max_length=128),
    limit: int = Query(default=MAP_EVENTS_LIMIT_DEFAULT, ge=1, le=MAP_EVENTS_LIMIT_MAX),
) -> MapEventListResponse:
    rate_key = (
        f"rl:map_events:user:{current_user.id}"
        if current_user is not None
        else f"rl:map_events:ip:{_client_ip(request)}"
    )
    await enforce_rate_limit(
        rate_key,
        limit=MAP_RATE_LIMIT,
        window_seconds=MAP_RATE_WINDOW_SECONDS,
    )
    return await MapEventService(session).get_map_events(
        bbox=MapBbox(
            lat_min=lat_min,
            lon_min=lon_min,
            lat_max=lat_max,
            lon_max=lon_max,
        ),
        city=city,
        limit=default_map_limit(limit),
        viewer=current_user,
    )
