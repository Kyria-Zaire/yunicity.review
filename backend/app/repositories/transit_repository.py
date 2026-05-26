"""Transit repository — nearby stops and departures (WEB-MAP-02)."""

from __future__ import annotations

import math
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transit import TransitDeparture, TransitFeedMeta, TransitStop

_EARTH_RADIUS_M = 6_371_000.0
_METERS_PER_DEGREE_LAT = 111_000.0


@dataclass(frozen=True, slots=True)
class NearbyStopRow:
    stop: TransitStop
    distance_meters: float


@dataclass(frozen=True, slots=True)
class DepartureRow:
    route_short_name: str
    route_type: str
    headsign: str
    scheduled_at: datetime
    realtime: bool


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_r = math.radians(lat1)
    lon1_r = math.radians(lon1)
    lat2_r = math.radians(lat2)
    lon2_r = math.radians(lon2)
    inner = math.cos(lat1_r) * math.cos(lat2_r) * math.cos(lon2_r - lon1_r) + math.sin(
        lat1_r
    ) * math.sin(lat2_r)
    clamped = min(1.0, max(-1.0, inner))
    return _EARTH_RADIUS_M * math.acos(clamped)


def _bbox_prefilter(
    lat: float, lon: float, radius_meters: float
) -> tuple[float, float, float, float]:
    lat_delta = radius_meters / _METERS_PER_DEGREE_LAT
    lon_scale = max(math.cos(math.radians(lat)), 0.01)
    lon_delta = radius_meters / (_METERS_PER_DEGREE_LAT * lon_scale)
    return lat - lat_delta, lat + lat_delta, lon - lon_delta, lon + lon_delta


class TransitRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_stops(self, city: str | None = None) -> int:
        stmt = select(func.count()).select_from(TransitStop)
        if city is not None:
            stmt = stmt.where(TransitStop.city == city)
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def get_latest_feed_meta(self) -> TransitFeedMeta | None:
        stmt = (
            select(TransitFeedMeta)
            .order_by(TransitFeedMeta.imported_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_nearby_stops(
        self,
        *,
        lat: float,
        lon: float,
        city: str,
        radius_meters: float,
        limit: int,
    ) -> list[NearbyStopRow]:
        lat_min, lat_max, lon_min, lon_max = _bbox_prefilter(lat, lon, radius_meters)
        stmt = select(TransitStop).where(
            TransitStop.city == city,
            TransitStop.latitude >= lat_min,
            TransitStop.latitude <= lat_max,
            TransitStop.longitude >= lon_min,
            TransitStop.longitude <= lon_max,
        )
        result = await self._session.execute(stmt)
        candidates = list(result.scalars().all())

        rows: list[NearbyStopRow] = []
        for stop in candidates:
            distance = _haversine_meters(lat, lon, stop.latitude, stop.longitude)
            if distance <= radius_meters:
                rows.append(NearbyStopRow(stop=stop, distance_meters=distance))

        rows.sort(key=lambda row: row.distance_meters)
        return rows[:limit]

    async def list_upcoming_departures(
        self,
        *,
        stop_ids: list[uuid.UUID],
        after: datetime,
        per_stop_limit: int,
    ) -> dict[uuid.UUID, list[DepartureRow]]:
        if not stop_ids:
            return {}

        stmt = (
            select(TransitDeparture)
            .where(TransitDeparture.stop_id.in_(stop_ids))
            .where(TransitDeparture.scheduled_at >= after)
            .order_by(TransitDeparture.stop_id, TransitDeparture.scheduled_at)
        )
        result = await self._session.execute(stmt)
        grouped: dict[uuid.UUID, list[DepartureRow]] = {sid: [] for sid in stop_ids}
        for dep in result.scalars().all():
            bucket = grouped.get(dep.stop_id)
            if bucket is None or len(bucket) >= per_stop_limit:
                continue
            bucket.append(
                DepartureRow(
                    route_short_name=dep.route_short_name,
                    route_type=dep.route_type,
                    headsign=dep.headsign,
                    scheduled_at=dep.scheduled_at,
                    realtime=dep.realtime,
                )
            )
        return grouped

    async def replace_all_feed_data(
        self,
        *,
        stops: list[TransitStop],
        departures: list[TransitDeparture],
        meta: TransitFeedMeta,
        departure_batch_size: int = 5_000,
    ) -> None:
        await self._session.execute(delete(TransitDeparture))
        await self._session.execute(delete(TransitStop))
        await self._session.execute(delete(TransitFeedMeta))
        self._session.add_all(stops)
        await self._session.flush()
        table = TransitDeparture.__table__
        for offset in range(0, len(departures), departure_batch_size):
            batch = departures[offset : offset + departure_batch_size]
            await self._session.execute(
                insert(table),
                [
                    {
                        "id": row.id,
                        "stop_id": row.stop_id,
                        "route_short_name": row.route_short_name,
                        "route_type": row.route_type,
                        "headsign": row.headsign,
                        "scheduled_at": row.scheduled_at,
                        "realtime": row.realtime,
                    }
                    for row in batch
                ],
            )
        self._session.add(meta)
