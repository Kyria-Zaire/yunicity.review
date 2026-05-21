"""Event map business logic (FEATURE-D / TICKET-D.3)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.map_constants import (
    MAP_BBOX_MAX_SURFACE_DEG2,
    MAP_DESCRIPTION_MAX_LENGTH,
    MAP_EVENTS_LIMIT_DEFAULT,
    MAP_EVENTS_LIMIT_MAX,
)
from app.models.local_event import LocalEvent
from app.models.user import User
from app.repositories.local_event_repository import LocalEventRepository
from app.schemas.map_event import MapBboxResponse, MapEventItem, MapEventListResponse
from app.services.neighborhood_summary import neighborhood_summary_from_event


@dataclass(frozen=True)
class MapBbox:
    lat_min: float
    lon_min: float
    lat_max: float
    lon_max: float


class MapEventService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._events = LocalEventRepository(session)

    async def get_map_events(
        self,
        *,
        bbox: MapBbox,
        city: str | None,
        limit: int,
        viewer: User | None,
    ) -> MapEventListResponse:
        self._validate_bbox(bbox)
        resolved_limit = min(max(limit, 1), MAP_EVENTS_LIMIT_MAX)
        resolved_city = self._resolve_city(city, viewer)

        now = datetime.now(UTC)
        rows = await self._events.list_public_in_bbox(
            lat_min=bbox.lat_min,
            lon_min=bbox.lon_min,
            lat_max=bbox.lat_max,
            lon_max=bbox.lon_max,
            city=resolved_city,
            limit=resolved_limit + 1,
            now=now,
        )
        truncated = len(rows) > resolved_limit
        visible = rows[:resolved_limit]
        items = [self._to_map_item(event) for event in visible]
        return MapEventListResponse(
            city=resolved_city,
            bbox=MapBboxResponse(
                lat_min=bbox.lat_min,
                lon_min=bbox.lon_min,
                lat_max=bbox.lat_max,
                lon_max=bbox.lon_max,
            ),
            count=len(items),
            truncated=truncated,
            events=items,
        )

    @staticmethod
    def _resolve_city(city: str | None, viewer: User | None) -> str:
        resolved = (city or "").strip() or (viewer.city.strip() if viewer and viewer.city else "")
        if not resolved:
            raise AppError(
                status_code=400,
                code="CITY_REQUIRED",
                detail="La ville est requise (paramètre city ou profil utilisateur).",
            )
        if len(resolved) > 128:
            raise AppError(
                status_code=422,
                code="CITY_INVALID",
                detail="Nom de ville trop long.",
            )
        return resolved

    @staticmethod
    def _validate_bbox(bbox: MapBbox) -> None:
        if bbox.lat_min > bbox.lat_max or bbox.lon_min > bbox.lon_max:
            raise AppError(
                status_code=422,
                code="INVALID_BBOX",
                detail="La bounding box est invalide.",
            )
        surface = (bbox.lat_max - bbox.lat_min) * (bbox.lon_max - bbox.lon_min)
        if surface > MAP_BBOX_MAX_SURFACE_DEG2:
            raise AppError(
                status_code=422,
                code="BBOX_TOO_LARGE",
                detail="Zone de carte trop étendue.",
            )

    @staticmethod
    def _to_map_item(event: LocalEvent) -> MapEventItem:
        description = event.description
        if description and len(description) > MAP_DESCRIPTION_MAX_LENGTH:
            description = description[: MAP_DESCRIPTION_MAX_LENGTH - 1].rstrip() + "…"
        return MapEventItem(
            id=event.id,
            title=event.title,
            description=description,
            city=event.city,
            district=event.district,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            location_name=event.location_name,
            latitude=float(event.latitude),  # type: ignore[arg-type]
            longitude=float(event.longitude),  # type: ignore[arg-type]
            neighborhood_summary=neighborhood_summary_from_event(event),
        )


def default_map_limit(raw: int | None) -> int:
    if raw is None:
        return MAP_EVENTS_LIMIT_DEFAULT
    return raw
