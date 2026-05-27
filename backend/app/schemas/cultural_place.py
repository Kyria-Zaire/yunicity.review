"""Cultural places API schemas (WEB-MAP-03, WEB-SEARCH-02B.1)."""

from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.schemas.map_event import MapBboxResponse


class CulturalPlaceNeighborhoodSummary(BaseModel):
    slug: str
    display_name: str


class CulturalGalleryImage(BaseModel):
    url: str
    alt: str | None = None
    credit: str | None = None
    source: str | None = None


class CulturalPlaceMediaFields(BaseModel):
    """Shared media payload for list, detail, and map responses."""

    image_url: str | None
    hero_image_url: str | None
    thumbnail_image_url: str | None
    gallery_images: list[CulturalGalleryImage] = Field(default_factory=list)
    editorial_excerpt: str | None
    photo_credit: str | None
    image_source: str | None


class CulturalPlaceListItem(CulturalPlaceMediaFields):
    id: uuid.UUID
    slug: str
    name: str
    short_description: str
    city: str
    address: str
    category: str
    latitude: float
    longitude: float
    image_alt: str | None
    source_name: str
    image_credit: str | None
    neighborhood: CulturalPlaceNeighborhoodSummary | None = None


class CulturalPlaceDetail(CulturalPlaceListItem):
    description: str | None
    source_url: str | None
    image_license: str | None
    is_featured: bool
    featured_priority: int
    image_blurhash: str | None = None


class CulturalPlaceListResponse(BaseModel):
    city: str
    items: list[CulturalPlaceListItem]
    count: int


class MapCulturalPlaceItem(CulturalPlaceMediaFields):
    id: uuid.UUID
    slug: str
    name: str
    category: str
    address: str
    city: str
    neighborhood: CulturalPlaceNeighborhoodSummary | None = None
    latitude: float
    longitude: float
    image_alt: str | None
    source_name: str
    image_credit: str | None


class MapCulturalPlaceListResponse(BaseModel):
    city: str
    bbox: MapBboxResponse
    count: int
    places: list[MapCulturalPlaceItem]
