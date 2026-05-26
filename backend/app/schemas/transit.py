"""Transit API schemas (WEB-MAP-02)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TransitMode = Literal["scheduled", "realtime"]


class TransitDepartureOut(BaseModel):
    route_short_name: str
    route_type: str
    headsign: str
    scheduled_at: datetime
    minutes: int
    realtime: bool


class TransitStopNearbyOut(BaseModel):
    stop_id: str
    name: str
    distance_meters: int
    departures: list[TransitDepartureOut]


class TransitNearbyResponse(BaseModel):
    city: str
    source: str
    mode: TransitMode
    disclaimer: str
    stops: list[TransitStopNearbyOut] = Field(default_factory=list)
