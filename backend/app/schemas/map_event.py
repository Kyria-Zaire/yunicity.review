"""Event map API schemas (FEATURE-D / TICKET-D.3)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.neighborhood import FeedNeighborhoodSummary


class MapBboxResponse(BaseModel):
    lat_min: float
    lon_min: float
    lat_max: float
    lon_max: float


class MapEventItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None = None
    city: str
    district: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    location_name: str
    latitude: float
    longitude: float
    neighborhood_summary: FeedNeighborhoodSummary | None = None


class MapEventListResponse(BaseModel):
    city: str | None = None
    bbox: MapBboxResponse
    count: int
    truncated: bool = False
    events: list[MapEventItem] = Field(default_factory=list)
