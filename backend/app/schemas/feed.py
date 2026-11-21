"""Feed API schemas (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.core.feed_constants import FEED_PAGE_SIZE_DEFAULT, FEED_PAGE_SIZE_MAX
from app.schemas.neighborhood import FeedNeighborhoodSummary


class FeedLocation(BaseModel):
    latitude: float
    longitude: float


class FeedAuthor(BaseModel):
    type: str
    id: uuid.UUID
    display_name: str
    username: str | None = None
    logo_url: str | None = None


class FeedOfferMeta(BaseModel):
    partner_offer_id: uuid.UUID
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    offer_type: str | None = None
    is_flash: bool = False
    flash_ends_at: datetime | None = None
    remaining_hours: int | None = None
    remaining_minutes: int | None = None


class FeedCreatorContentMeta(BaseModel):
    partner_creator_content_id: uuid.UUID
    published_at: datetime | None = None


class FeedEventMeta(BaseModel):
    local_event_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime | None = None
    location_name: str
    district: str | None = None
    event_type: str | None = None
    interested_by_me: bool = False


class FeedMediaItem(BaseModel):
    """Un média d'une publication, tel que le fil le restitue.

    Le littéral est redéclaré ici plutôt qu'importé de `schemas.post` : ce
    module est en AMONT (`schemas.post` importe `schemas.feed`), et l'importer
    créerait un cycle.
    """

    url: str
    media_type: Literal["image", "video"] = "image"


class FeedPostItem(BaseModel):
    id: uuid.UUID
    type: str
    author: FeedAuthor
    city: str | None
    title: str | None
    body: str | None
    media_url: str | None = None
    #: Liste ORDONNÉE des médias. `media_url` reste le PREMIER, inchangé, pour
    #: les clients antérieurs à MEDIA-MULTI-PHOTO-01. Vide pour les
    #: publications dont la colonne `media_urls` n'a jamais été écrite : le
    #: client retombe alors sur `media_url` — aucune valeur n'est inventée ici.
    media_urls: list[FeedMediaItem] = Field(default_factory=list)
    location: FeedLocation | None = None
    like_count: int
    comment_count: int
    liked_by_me: bool
    offer: FeedOfferMeta | None = None
    event: FeedEventMeta | None = None
    creator_content: FeedCreatorContentMeta | None = None
    neighborhood_summary: FeedNeighborhoodSummary | None = None
    created_at: datetime
    updated_at: datetime


class FeedListResponse(BaseModel):
    items: list[FeedPostItem]
    next_cursor: str | None = None


class FeedListParams(BaseModel):
    cursor: str | None = None
    limit: int = Field(default=FEED_PAGE_SIZE_DEFAULT, ge=1, le=FEED_PAGE_SIZE_MAX)
