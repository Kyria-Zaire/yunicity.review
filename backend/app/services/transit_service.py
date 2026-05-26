"""Transit nearby service with short TTL cache (WEB-MAP-02)."""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from datetime import datetime
from typing import cast
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.transit_constants import (
    TRANSIT_DEPARTURES_PER_STOP,
    TRANSIT_DISCLAIMER_REALTIME,
    TRANSIT_DISCLAIMER_SCHEDULED,
    TRANSIT_MODE_REALTIME,
    TRANSIT_MODE_SCHEDULED,
    TRANSIT_SOURCE_GRAND_REIMS,
)
from app.repositories.transit_repository import TransitRepository
from app.schemas.transit import (
    TransitDepartureOut,
    TransitMode,
    TransitNearbyResponse,
    TransitStopNearbyOut,
)

_PARIS = ZoneInfo("Europe/Paris")
_CACHE: dict[str, tuple[float, TransitNearbyResponse]] = {}


@dataclass(frozen=True, slots=True)
class TransitNearbyQuery:
    lat: float
    lon: float
    city: str
    radius_meters: int
    limit: int


def _cache_key(query: TransitNearbyQuery) -> str:
    lat_r = round(query.lat, 3)
    lon_r = round(query.lon, 3)
    return f"{query.city}:{lat_r}:{lon_r}:{query.radius_meters}:{query.limit}"


def _minutes_until(scheduled_at: datetime, now: datetime) -> int:
    delta = scheduled_at - now
    return max(0, int(math.ceil(delta.total_seconds() / 60.0)))


class TransitService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = TransitRepository(session)

    async def get_nearby(self, query: TransitNearbyQuery) -> TransitNearbyResponse:
        key = _cache_key(query)
        cached = _CACHE.get(key)
        now_mono = time.monotonic()
        if cached is not None and now_mono - cached[0] < 60:
            return cached[1]

        now_paris = datetime.now(tz=_PARIS)
        stop_count = await self._repo.count_stops(city=query.city)
        meta = await self._repo.get_latest_feed_meta()

        mode = cast(TransitMode, TRANSIT_MODE_SCHEDULED)
        disclaimer = TRANSIT_DISCLAIMER_SCHEDULED
        if meta is not None and meta.mode == TRANSIT_MODE_REALTIME:
            mode = cast(TransitMode, TRANSIT_MODE_REALTIME)
            disclaimer = TRANSIT_DISCLAIMER_REALTIME

        if stop_count == 0:
            response = TransitNearbyResponse(
                city=query.city,
                source=TRANSIT_SOURCE_GRAND_REIMS,
                mode=mode,
                disclaimer=disclaimer,
                stops=[],
            )
            _CACHE[key] = (now_mono, response)
            return response

        nearby = await self._repo.find_nearby_stops(
            lat=query.lat,
            lon=query.lon,
            city=query.city,
            radius_meters=float(query.radius_meters),
            limit=query.limit,
        )
        stop_ids = [row.stop.id for row in nearby]
        departures_by_stop = await self._repo.list_upcoming_departures(
            stop_ids=stop_ids,
            after=now_paris,
            per_stop_limit=TRANSIT_DEPARTURES_PER_STOP,
        )

        stops_out: list[TransitStopNearbyOut] = []
        for row in nearby:
            deps = departures_by_stop.get(row.stop.id, [])
            if not deps:
                continue
            stops_out.append(
                TransitStopNearbyOut(
                    stop_id=row.stop.external_stop_id,
                    name=row.stop.name,
                    distance_meters=int(round(row.distance_meters)),
                    departures=[
                        TransitDepartureOut(
                            route_short_name=d.route_short_name,
                            route_type=d.route_type,
                            headsign=d.headsign,
                            scheduled_at=d.scheduled_at,
                            minutes=_minutes_until(
                                d.scheduled_at.astimezone(_PARIS),
                                now_paris,
                            ),
                            realtime=d.realtime,
                        )
                        for d in deps
                    ],
                )
            )

        response = TransitNearbyResponse(
            city=query.city,
            source=TRANSIT_SOURCE_GRAND_REIMS,
            mode=mode,
            disclaimer=disclaimer,
            stops=stops_out,
        )
        _CACHE[key] = (now_mono, response)
        return response


def clear_transit_cache_for_tests() -> None:
    _CACHE.clear()
