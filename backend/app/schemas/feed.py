"""Feed API schemas (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.feed_constants import FEED_PAGE_SIZE_DEFAULT, FEED_PAGE_SIZE_MAX


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


class FeedPostItem(BaseModel):
    id: uuid.UUID
    type: str
    author: FeedAuthor
    city: str | None
    title: str | None
    body: str | None
    media_url: str | None = None
    location: FeedLocation | None = None
    like_count: int
    comment_count: int
    liked_by_me: bool
    offer: FeedOfferMeta | None = None
    created_at: datetime
    updated_at: datetime


class FeedListResponse(BaseModel):
    items: list[FeedPostItem]
    next_cursor: str | None = None


class FeedListParams(BaseModel):
    cursor: str | None = None
    limit: int = Field(default=FEED_PAGE_SIZE_DEFAULT, ge=1, le=FEED_PAGE_SIZE_MAX)
