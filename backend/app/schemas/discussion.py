"""Discussions portal API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.discussion_constants import (
    DISCUSSION_BODY_MAX_LENGTH,
    DISCUSSION_PAGE_SIZE_DEFAULT,
    DISCUSSION_PAGE_SIZE_MAX,
    DISCUSSION_TAG_MAX_LENGTH,
    DISCUSSION_TAGS_MAX_COUNT,
    DISCUSSION_TITLE_MAX_LENGTH,
    DiscussionCategory,
)
from app.schemas.feed import FeedPostItem


class DiscussionParticipant(BaseModel):
    display_name: str
    avatar_url: str | None = None


class DiscussionThreadItem(FeedPostItem):
    discussion_title: str
    excerpt: str
    category_ids: list[str]
    category_labels: list[str]
    discussion_tags: list[str] = Field(default_factory=list)
    linked_tribe_id: uuid.UUID | None = None
    linked_tribe_name: str | None = None
    participants: list[DiscussionParticipant]
    participants_overflow: int = 0
    last_activity_at: datetime | None = None


class DiscussionListResponse(BaseModel):
    items: list[DiscussionThreadItem]
    next_cursor: str | None = None
    city: str | None = None


class DiscussionTrendingTopic(BaseModel):
    id: str
    label: str
    message_count: int


class DiscussionActiveItem(BaseModel):
    post_id: uuid.UUID
    title: str
    reply_count: int
    last_activity_at: datetime | None
    has_recent_activity: bool
    author_display_name: str
    author_avatar_url: str | None = None


class DiscussionInsightsResponse(BaseModel):
    trending_topics: list[DiscussionTrendingTopic]
    active_discussions: list[DiscussionActiveItem]


class DiscussionListParams(BaseModel):
    category: DiscussionCategory = DiscussionCategory.ALL
    cursor: str | None = None
    limit: int = Field(default=DISCUSSION_PAGE_SIZE_DEFAULT, ge=1, le=DISCUSSION_PAGE_SIZE_MAX)
    require_comments: bool = False


class DiscussionCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=DISCUSSION_TITLE_MAX_LENGTH)
    body: str = Field(..., min_length=10, max_length=DISCUSSION_BODY_MAX_LENGTH)
    category: DiscussionCategory = DiscussionCategory.ALL
    tags: list[str] = Field(default_factory=list, max_length=DISCUSSION_TAGS_MAX_COUNT)
    linked_tribe_id: uuid.UUID | None = None
    media_url: str | None = Field(default=None, max_length=500)

    @field_validator("title", "body")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for raw in values:
            tag = raw.strip()
            if not tag:
                continue
            if len(tag) > DISCUSSION_TAG_MAX_LENGTH:
                raise ValueError(f"Tag trop long (max {DISCUSSION_TAG_MAX_LENGTH} caractères)")
            key = tag.lower()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(tag)
        return normalized
