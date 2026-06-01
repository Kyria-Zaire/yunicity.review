"""Stories portal API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.story_constants import (
    STORY_CAPTION_MAX_LENGTH,
    STORY_LOCATION_LABEL_MAX_LENGTH,
    STORY_TAG_MAX_LENGTH,
    STORY_TAGS_MAX_COUNT,
    StoryAudience,
    StoryCategory,
)
from app.schemas.feed import FeedAuthor
from app.schemas.post import PostLocationInput


class StoryItem(BaseModel):
    id: uuid.UUID
    author: FeedAuthor
    caption: str
    media_url: str
    location_label: str | None = None
    category_ids: list[str]
    category_labels: list[str]
    view_count: int
    like_count: int
    liked_by_me: bool
    created_at: datetime
    expires_at: datetime | None = None
    is_recent: bool = False
    city: str | None = None


class StoryListResponse(BaseModel):
    items: list[StoryItem]
    next_cursor: str | None = None
    city: str | None = None


class StoryRingItem(BaseModel):
    author_id: uuid.UUID
    author_name: str
    author_avatar_url: str | None = None
    subtitle: str
    latest_story_id: uuid.UUID
    latest_media_url: str | None = None
    has_recent: bool = False


class StoryRingsResponse(BaseModel):
    items: list[StoryRingItem]
    publish_href: str = "/stories/new"


class StoryLiveItem(BaseModel):
    story_id: uuid.UUID
    author_name: str
    author_avatar_url: str | None = None
    location_label: str | None = None
    subtitle: str
    view_count: int
    is_recent: bool


class StoryContributorItem(BaseModel):
    author_id: uuid.UUID
    author_name: str
    author_avatar_url: str | None = None
    story_count: int


class StoryFeaturedItem(BaseModel):
    story_id: uuid.UUID
    title: str
    description: str
    media_url: str
    href: str


class StoryInsightsResponse(BaseModel):
    live_stories: list[StoryLiveItem]
    top_contributors: list[StoryContributorItem]
    featured: StoryFeaturedItem | None = None


class StoryCreateRequest(BaseModel):
    media_url: str = Field(..., min_length=8, max_length=500)
    caption: str = Field(default="", max_length=STORY_CAPTION_MAX_LENGTH)
    category: StoryCategory = StoryCategory.ALL
    audience: StoryAudience = StoryAudience.PUBLIC
    tags: list[str] = Field(default_factory=list, max_length=STORY_TAGS_MAX_COUNT)
    media_type: str | None = Field(default=None, max_length=16)
    location_label: str | None = Field(default=None, max_length=STORY_LOCATION_LABEL_MAX_LENGTH)
    location: PostLocationInput | None = None

    @field_validator("location_label")
    @classmethod
    def strip_location(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("caption")
    @classmethod
    def strip_caption(cls, value: str) -> str:
        return value.strip()

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for raw in values:
            tag = raw.strip().lstrip("#")
            if not tag:
                continue
            if len(tag) > STORY_TAG_MAX_LENGTH:
                raise ValueError(f"Tag trop long (max {STORY_TAG_MAX_LENGTH} caractères)")
            key = tag.lower()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(tag)
        return normalized


class StoryMediaUploadResponse(BaseModel):
    url: str
    media_type: str
