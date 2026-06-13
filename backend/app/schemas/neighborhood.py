"""Neighborhood API schemas (TICKET-602)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

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
from app.core.neighborhood_v2_constants import (
    NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH,
    NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH,
    NeighborhoodContributionAnonymousGender,
    NeighborhoodContributionIdentityType,
)


class FeedNeighborhoodSummary(BaseModel):
    """Lightweight feed badge — no scores, no rankings."""

    slug: str
    display_name: str


class NeighborhoodAliasItem(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_primary: bool


class NeighborhoodTimelineItem(BaseModel):
    id: uuid.UUID
    year: int
    title: str
    description: str | None
    display_order: int


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
    long_story: str | None = None
    featured_quote: str | None = None
    aliases: list[NeighborhoodAliasItem] = Field(default_factory=list)
    moods: list[str] = Field(default_factory=list)
    timeline: list[NeighborhoodTimelineItem] = Field(default_factory=list)


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


class NeighborhoodDetailHero(BaseModel):
    id: uuid.UUID
    slug: str
    display_name: str
    official_label: str
    aliases: list[NeighborhoodAliasItem] = Field(default_factory=list)
    moods: list[str] = Field(default_factory=list)
    featured_quote: str | None = None
    cover_image_url: str | None = None
    hero_image_storage_key: str | None = None


class NeighborhoodDetailHistory(BaseModel):
    long_story: str | None = None
    featured_quote: str | None = None


class NeighborhoodDetailVideoAuthor(BaseModel):
    id: uuid.UUID
    username: str | None = None
    full_name: str
    avatar_url: str | None = None


class NeighborhoodDetailVideoItem(BaseModel):
    id: uuid.UUID
    title: str | None = None
    thumbnail_url: str
    duration_seconds: float
    neighborhood_slug: str
    published_at: datetime | None = None
    video_type: str
    author: NeighborhoodDetailVideoAuthor


class NeighborhoodDetailPlaceItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    category: str
    image_url: str | None = None
    is_partner: bool = False


class NeighborhoodDetailEventItem(BaseModel):
    id: uuid.UUID
    title: str
    starts_at: datetime
    location_name: str
    cover_image_url: str | None = None


class NeighborhoodDetailPassportOfferItem(BaseModel):
    id: uuid.UUID
    title: str
    organization_name: str


class NeighborhoodDetailContributionItem(BaseModel):
    id: uuid.UUID
    title: str | None = None
    body: str
    created_at: datetime


class NeighborhoodDetailTribeItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str


class NeighborhoodDetailCreatorItem(BaseModel):
    id: uuid.UUID
    username: str | None = None
    full_name: str
    avatar_url: str | None = None


class NeighborhoodDetailStats(BaseModel):
    places_count: int
    events_count: int
    videos_count: int
    tribes_count: int
    creators_count: int
    contributions_count: int


class NeighborhoodDetailResponse(NeighborhoodResponse):
    """Quartier vivant — superset V1 + blocs structurés (FEATURE-QUARTIERS-V2 / Q2-S1-03)."""

    hero: NeighborhoodDetailHero | None = None
    history: NeighborhoodDetailHistory | None = None
    videos: list[NeighborhoodDetailVideoItem] = Field(default_factory=list)
    places: list[NeighborhoodDetailPlaceItem] = Field(default_factory=list)
    events: list[NeighborhoodDetailEventItem] = Field(default_factory=list)
    tribes: list[NeighborhoodDetailTribeItem] = Field(default_factory=list)
    creators: list[NeighborhoodDetailCreatorItem] = Field(default_factory=list)
    passport_offers: list[NeighborhoodDetailPassportOfferItem] = Field(default_factory=list)
    contributions: list[NeighborhoodDetailContributionItem] = Field(default_factory=list)
    stats: NeighborhoodDetailStats | None = None


class NeighborhoodContributionSubmitRequest(BaseModel):
    identity_type: NeighborhoodContributionIdentityType
    title: str | None = Field(default=None, max_length=NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH)
    body: str = Field(max_length=NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH)
    anonymous_gender: NeighborhoodContributionAnonymousGender | None = None

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class NeighborhoodContributionSubmitResponse(BaseModel):
    id: uuid.UUID
    status: str
    submitted_at: datetime
    message: str
