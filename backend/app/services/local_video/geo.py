"""Geo helpers for Local Video feed (FEATURE-CREATORS-V2 / C2-S2-00)."""

from __future__ import annotations

import math

EARTH_RADIUS_METERS = 6_371_000
WALKING_METERS_PER_MINUTE = 80


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_METERS * math.asin(min(1.0, math.sqrt(a)))


def walking_minutes_from_meters(distance_meters: float) -> int:
    if distance_meters <= 0:
        return 0
    return int(math.ceil(distance_meters / WALKING_METERS_PER_MINUTE))
