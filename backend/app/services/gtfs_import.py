"""GTFS static import for Grand Reims (WEB-MAP-02) — stdlib only."""

from __future__ import annotations

import csv
import io
import uuid
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from app.core.transit_constants import (
    GTFS_ROUTE_TYPE_LABELS,
    TRANSIT_MODE_SCHEDULED,
    TRANSIT_SOURCE_GRAND_REIMS,
)
from app.models.transit import TransitDeparture, TransitFeedMeta, TransitStop

_PARIS = ZoneInfo("Europe/Paris")
_DEPARTURE_HORIZON_HOURS = 48


@dataclass(frozen=True, slots=True)
class GtfsImportResult:
    stops: int
    departures: int


def _read_csv(zip_file: zipfile.ZipFile, name: str) -> list[dict[str, str]]:
    try:
        raw = zip_file.read(name)
    except KeyError:
        return []
    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


def _parse_gtfs_time(value: str) -> tuple[int, int, int]:
    parts = value.strip().split(":")
    if len(parts) != 3:
        raise ValueError(f"Invalid GTFS time: {value}")
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = int(parts[2])
    return hours, minutes, seconds


def _gtfs_time_to_datetime(day: date, gtfs_time: str) -> datetime:
    hours, minutes, seconds = _parse_gtfs_time(gtfs_time)
    base = datetime(day.year, day.month, day.day, tzinfo=_PARIS)
    if hours >= 24:
        base = base + timedelta(days=hours // 24)
        hours = hours % 24
    return base.replace(hour=hours, minute=minutes, second=seconds)


def _route_type_label(route_type_raw: str) -> str:
    try:
        code = int(route_type_raw)
    except ValueError:
        return "other"
    return GTFS_ROUTE_TYPE_LABELS.get(code, "other")


def _service_active_on(service: dict[str, str], day: date) -> bool:
    start_s = service.get("start_date", "")
    end_s = service.get("end_date", "")
    if start_s and end_s:
        start_d = datetime.strptime(start_s, "%Y%m%d").date()
        end_d = datetime.strptime(end_s, "%Y%m%d").date()
        if day < start_d or day > end_d:
            return False
    weekday = day.weekday()
    keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    flag = service.get(keys[weekday], "0")
    return flag == "1"


def parse_gtfs_zip(
    data: bytes,
    *,
    city: str = "Reims",
    horizon_hours: int = _DEPARTURE_HORIZON_HOURS,
) -> tuple[list[TransitStop], list[TransitDeparture], TransitFeedMeta]:
    now_paris = datetime.now(tz=_PARIS)
    window_end = now_paris + timedelta(hours=horizon_hours)

    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        calendars = _read_csv(zf, "calendar.txt")
        calendar_by_service = {row["service_id"]: row for row in calendars}
        calendar_dates = _read_csv(zf, "calendar_dates.txt")
        added_dates: dict[str, set[date]] = {}
        removed_dates: dict[str, set[date]] = {}
        for row in calendar_dates:
            sid = row["service_id"]
            d = datetime.strptime(row["date"], "%Y%m%d").date()
            if row.get("exception_type") == "1":
                added_dates.setdefault(sid, set()).add(d)
            elif row.get("exception_type") == "2":
                removed_dates.setdefault(sid, set()).add(d)

        routes = {row["route_id"]: row for row in _read_csv(zf, "routes.txt")}
        trips = _read_csv(zf, "trips.txt")
        trip_by_id = {row["trip_id"]: row for row in trips}
        stops_raw = _read_csv(zf, "stops.txt")
        stop_times = _read_csv(zf, "stop_times.txt")

    stop_models: dict[str, TransitStop] = {}
    for row in stops_raw:
        if row.get("location_type") == "1":
            continue
        lat_s = row.get("stop_lat", "")
        lon_s = row.get("stop_lon", "")
        if not lat_s or not lon_s:
            continue
        external_id = row["stop_id"]
        stop_models[external_id] = TransitStop(
            id=uuid.uuid4(),
            external_stop_id=external_id,
            name=row.get("stop_name", external_id),
            latitude=float(lat_s),
            longitude=float(lon_s),
            city=city,
        )

    departures: list[TransitDeparture] = []
    days: list[date] = [now_paris.date()]
    if window_end.date() > now_paris.date():
        days.append(window_end.date())

    def service_runs(trip: dict[str, str], day: date) -> bool:
        sid = trip["service_id"]
        if day in removed_dates.get(sid, set()):
            return False
        if day in added_dates.get(sid, set()):
            return True
        service = calendar_by_service.get(sid)
        if service is None:
            return True
        return _service_active_on(service, day)

    for row in stop_times:
        trip_id = row.get("trip_id", "")
        stop_id = row.get("stop_id", "")
        arrival = row.get("arrival_time") or row.get("departure_time", "")
        if not trip_id or not stop_id or not arrival:
            continue
        trip = trip_by_id.get(trip_id)
        stop = stop_models.get(stop_id)
        if trip is None or stop is None:
            continue
        route = routes.get(trip.get("route_id", ""), {})
        route_short = route.get("route_short_name") or route.get("route_long_name", "?")
        route_type = _route_type_label(route.get("route_type", ""))
        headsign = trip.get("trip_headsign") or route.get("route_long_name", "")

        for day in days:
            if not service_runs(trip, day):
                continue
            scheduled_at = _gtfs_time_to_datetime(day, arrival)
            if scheduled_at < now_paris or scheduled_at > window_end:
                continue
            departures.append(
                TransitDeparture(
                    id=uuid.uuid4(),
                    stop_id=stop.id,
                    route_short_name=str(route_short)[:32],
                    route_type=route_type,
                    headsign=str(headsign)[:255],
                    scheduled_at=scheduled_at.astimezone(_PARIS),
                    realtime=False,
                )
            )

    valid_from = now_paris.date()
    valid_to = window_end.date()
    meta = TransitFeedMeta(
        source=TRANSIT_SOURCE_GRAND_REIMS,
        mode=TRANSIT_MODE_SCHEDULED,
        gtfs_url=None,
        imported_at=datetime.now(tz=_PARIS),
        valid_from=valid_from,
        valid_to=valid_to,
    )
    return list(stop_models.values()), departures, meta


def load_gtfs_bytes(path_or_bytes: Path | bytes) -> bytes:
    if isinstance(path_or_bytes, Path):
        return path_or_bytes.read_bytes()
    return path_or_bytes
