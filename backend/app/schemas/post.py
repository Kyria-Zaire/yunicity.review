"""Post API schemas (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.feed_constants import COMMENT_BODY_MAX_LENGTH, POST_BODY_MAX_LENGTH
from app.schemas.feed import FeedAuthor, FeedEventMeta, FeedLocation, FeedOfferMeta
from app.schemas.neighborhood import FeedNeighborhoodSummary

PostAuthorTypeLiteral = Literal["citizen", "organization"]


class PostLocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PostCreateRequest(BaseModel):
    author_type: PostAuthorTypeLiteral = "citizen"
    organization_id: uuid.UUID | None = None
    body: str = Field(..., min_length=1, max_length=POST_BODY_MAX_LENGTH)
    media_url: str | None = Field(default=None, max_length=500)
    location: PostLocationInput | None = None

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_organization_author(self) -> PostCreateRequest:
        if self.author_type == "organization" and self.organization_id is None:
            raise ValueError("organization_id requis pour un post organisation")
        if self.author_type == "citizen" and self.organization_id is not None:
            raise ValueError("organization_id interdit pour un post citoyen")
        return self


class PostUpdateRequest(BaseModel):
    body: str | None = Field(default=None, min_length=1, max_length=POST_BODY_MAX_LENGTH)
    media_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    location: PostLocationInput | None = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> PostUpdateRequest:
        if (
            self.body is None
            and self.media_url is None
            and self.is_active is None
            and self.location is None
        ):
            raise ValueError("Au moins un champ à modifier")
        return self


class PostResponse(BaseModel):
    id: uuid.UUID
    type: str
    author: FeedAuthor
    city: str | None
    title: str | None
    body: str | None
    media_url: str | None
    location: FeedLocation | None
    like_count: int
    comment_count: int
    is_active: bool
    liked_by_me: bool
    offer: FeedOfferMeta | None = None
    event: FeedEventMeta | None = None
    neighborhood_summary: FeedNeighborhoodSummary | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentCreateRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=COMMENT_BODY_MAX_LENGTH)

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()


class CommentResponse(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    author_display_name: str
    author_username: str | None
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentListResponse(BaseModel):
    items: list[CommentResponse]
    next_cursor: str | None = None


class ReportCreateRequest(BaseModel):
    reason: Literal["spam", "inappropriate", "other"]
