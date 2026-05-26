"""Grand Reims transit constants (WEB-MAP-02)."""

from __future__ import annotations

TRANSIT_SOURCE_GRAND_REIMS = "grand_reims_mobilites"
TRANSIT_MODE_SCHEDULED = "scheduled"
TRANSIT_MODE_REALTIME = "realtime"
TRANSIT_DISCLAIMER_SCHEDULED = "Horaires indicatifs Grand Reims Mobilités"
TRANSIT_DISCLAIMER_REALTIME = "Horaires temps réel Grand Reims Mobilités"

TRANSIT_NEARBY_RADIUS_DEFAULT_M = 600
TRANSIT_NEARBY_RADIUS_MAX_M = 2000
TRANSIT_NEARBY_STOPS_LIMIT = 5
TRANSIT_DEPARTURES_PER_STOP = 2
TRANSIT_CACHE_TTL_SECONDS = 60

# Reims — centre carte par défaut si lat/lon absents côté client
TRANSIT_DEFAULT_LAT = 49.2583
TRANSIT_DEFAULT_LON = 4.0317

GTFS_ROUTE_TYPE_LABELS: dict[int, str] = {
    0: "tram",
    1: "metro",
    2: "rail",
    3: "bus",
    11: "trolleybus",
    12: "monorail",
}
