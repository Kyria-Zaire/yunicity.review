"""Cultural places API schemas (WEB-MAP-03)."""

from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.schemas.map_event import MapBboxResponse


class CulturalPlaceNeighborhoodSummary(BaseModel):
    slug: str
    display_name: str


class CulturalPlaceListItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    short_description: str
    city: str
    address: str
    category: str
    latitude: float
    longitude: float
    image_url: str | None
    image_alt: str | None
    source_name: str
    image_credit: str | None
    neighborhood: CulturalPlaceNeighborhoodSummary | None = None


class CulturalPlaceDetail(CulturalPlaceListItem):
    description: str | None
    source_url: str | None
    image_license: str | None
    is_featured: bool


class CulturalPlaceListResponse(BaseModel):
    city: str
    items: list[CulturalPlaceListItem]
    count: int


class MapCulturalPlaceItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    category: str
    address: str
    city: str
    neighborhood: CulturalPlaceNeighborhoodSummary | None = None
    latitude: float
    longitude: float
    image_url: str | None
    image_alt: str | None
    source_name: str
    image_credit: str | None


class MapCulturalPlaceListResponse(BaseModel):
    city: str
    bbox: MapBboxResponse
    count: int
    places: list[MapCulturalPlaceItem]
