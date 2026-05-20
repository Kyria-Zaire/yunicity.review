"""Neighborhood API schemas (TICKET-602)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.neighborhood_constants import (
    NEIGHBORHOOD_ACCENT_COLOR_MAX_LENGTH,
    NEIGHBORHOOD_AMBIANCE_MAX_LENGTH,
    NEIGHBORHOOD_CITY_MAX_LENGTH,
    NEIGHBORHOOD_COVER_URL_MAX_LENGTH,
    NEIGHBORHOOD_DISPLAY_NAME_MAX_LENGTH,
    NEIGHBORHOOD_LIST_PAGE_SIZE_DEFAULT,
    NEIGHBORHOOD_LIST_PAGE_SIZE_MAX,
    NEIGHBORHOOD_SHORT_DESCRIPTION_MAX_LENGTH,
    NEIGHBORHOOD_SLUG_MAX_LENGTH,
)


class FeedNeighborhoodSummary(BaseModel):
    """Lightweight feed badge — no scores, no rankings."""

    slug: str
    display_name: str


class NeighborhoodResponse(BaseModel):
    id: uuid.UUID
    city: str
    slug: str
    display_name: str
    short_description: str | None
    ambiance: str | None
    cover_image_url: str | None
    accent_color: str | None
    latitude: float | None
    longitude: float | None
    radius_meters: int | None
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class NeighborhoodListResponse(BaseModel):
    items: list[NeighborhoodResponse]
    total: int
    page: int
    page_size: int


class NeighborhoodCreateRequest(BaseModel):
    city: str = Field(max_length=NEIGHBORHOOD_CITY_MAX_LENGTH)
    slug: str = Field(max_length=NEIGHBORHOOD_SLUG_MAX_LENGTH)
    display_name: str = Field(max_length=NEIGHBORHOOD_DISPLAY_NAME_MAX_LENGTH)
    short_description: str | None = Field(
        default=None, max_length=NEIGHBORHOOD_SHORT_DESCRIPTION_MAX_LENGTH
    )
    ambiance: str | None = Field(default=None, max_length=NEIGHBORHOOD_AMBIANCE_MAX_LENGTH)
    cover_image_url: str | None = Field(default=None, max_length=NEIGHBORHOOD_COVER_URL_MAX_LENGTH)
    accent_color: str | None = Field(default=None, max_length=NEIGHBORHOOD_ACCENT_COLOR_MAX_LENGTH)
    latitude: float | None = None
    longitude: float | None = None
    radius_meters: int | None = Field(default=None, ge=50, le=5000)
    is_featured: bool = False
    is_active: bool = True


class NeighborhoodUpdateRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=NEIGHBORHOOD_DISPLAY_NAME_MAX_LENGTH)
    short_description: str | None = Field(
        default=None, max_length=NEIGHBORHOOD_SHORT_DESCRIPTION_MAX_LENGTH
    )
    ambiance: str | None = Field(default=None, max_length=NEIGHBORHOOD_AMBIANCE_MAX_LENGTH)
    cover_image_url: str | None = Field(default=None, max_length=NEIGHBORHOOD_COVER_URL_MAX_LENGTH)
    accent_color: str | None = Field(default=None, max_length=NEIGHBORHOOD_ACCENT_COLOR_MAX_LENGTH)
    latitude: float | None = None
    longitude: float | None = None
    radius_meters: int | None = Field(default=None, ge=50, le=5000)
    is_featured: bool | None = None
    is_active: bool | None = None


class NeighborhoodContextStats(BaseModel):
    """Light counts — not rankings."""

    events_count: int
    organizations_count: int
    offers_count: int
    posts_count: int


class NeighborhoodContextEventItem(BaseModel):
    id: uuid.UUID
    title: str
    starts_at: datetime
    location_name: str


class NeighborhoodContextOrganizationItem(BaseModel):
    id: uuid.UUID
    name: str
    slug: str


class NeighborhoodContextOfferItem(BaseModel):
    id: uuid.UUID
    title: str
    organization_name: str


class NeighborhoodContextPostItem(BaseModel):
    id: uuid.UUID
    type: str
    title: str | None
    body: str | None
    created_at: datetime


class NeighborhoodContextResponse(BaseModel):
    neighborhood: NeighborhoodResponse
    stats: NeighborhoodContextStats
    recent_events: list[NeighborhoodContextEventItem]
    organizations: list[NeighborhoodContextOrganizationItem]
    recent_offers: list[NeighborhoodContextOfferItem]
    recent_posts: list[NeighborhoodContextPostItem]


class NeighborhoodListParams(BaseModel):
    city: str = Field(min_length=1, max_length=NEIGHBORHOOD_CITY_MAX_LENGTH)
    featured_only: bool = False
    page: int = Field(default=1, ge=1)
    page_size: int = Field(
        default=NEIGHBORHOOD_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=NEIGHBORHOOD_LIST_PAGE_SIZE_MAX,
    )
