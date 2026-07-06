"""Post API schemas (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.feed_constants import COMMENT_BODY_MAX_LENGTH, POST_BODY_MAX_LENGTH
from app.core.post_composer_constants import (
    POST_ACTIVITY_LABEL_MAX_LENGTH,
    POST_COMPOSER_BODY_MAX_LENGTH,
    POST_LOCATION_LABEL_MAX_LENGTH,
    POST_MEDIA_MAX_COUNT,
    POST_POLL_OPTION_MAX_LENGTH,
    POST_POLL_OPTIONS_MAX,
    POST_POLL_OPTIONS_MIN,
    POST_POLL_QUESTION_MAX_LENGTH,
    POST_TAGGED_USERS_MAX,
    PostFormat,
    PostVisibility,
)
from app.schemas.feed import (
    FeedAuthor,
    FeedCreatorContentMeta,
    FeedEventMeta,
    FeedLocation,
    FeedOfferMeta,
)
from app.schemas.neighborhood import FeedNeighborhoodSummary

PostAuthorTypeLiteral = Literal["citizen", "organization"]
PostMediaTypeLiteral = Literal["image", "video"]


class PostLocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PostMediaItemInput(BaseModel):
    url: str = Field(..., min_length=8, max_length=500)
    media_type: PostMediaTypeLiteral = "image"


class PostPollInput(BaseModel):
    question: str = Field(..., min_length=1, max_length=POST_POLL_QUESTION_MAX_LENGTH)
    options: list[str] = Field(..., min_length=POST_POLL_OPTIONS_MIN, max_length=POST_POLL_OPTIONS_MAX)

    @field_validator("options")
    @classmethod
    def normalize_options(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) < POST_POLL_OPTIONS_MIN:
            raise ValueError("Au moins deux options de sondage requises.")
        for option in cleaned:
            if len(option) > POST_POLL_OPTION_MAX_LENGTH:
                raise ValueError("Option de sondage trop longue.")
        return cleaned


class PostCrossPostTargetsInput(BaseModel):
    instagram: bool = False
    tiktok: bool = False
    facebook: bool = False
    twitter: bool = False


class PostComposerMetaResponse(BaseModel):
    visibility: PostVisibility
    post_format: PostFormat | None = None
    media_urls: list[PostMediaItemInput] = Field(default_factory=list)
    allow_comments: bool
    allow_shares: bool
    scheduled_at: datetime | None = None
    location_label: str | None = None
    activity_label: str | None = None
    linked_tribe_id: uuid.UUID | None = None
    tagged_user_ids: list[uuid.UUID] = Field(default_factory=list)
    audience_user_ids: list[uuid.UUID] = Field(default_factory=list)
    poll: PostPollInput | None = None
    cross_post_targets: PostCrossPostTargetsInput | None = None
    use_media_caption: bool = False


class PostCreateRequest(BaseModel):
    author_type: PostAuthorTypeLiteral = "citizen"
    organization_id: uuid.UUID | None = None
    body: str = Field(..., min_length=1, max_length=POST_BODY_MAX_LENGTH)
    media_url: str | None = Field(default=None, max_length=500)
    media_urls: list[PostMediaItemInput] = Field(default_factory=list, max_length=POST_MEDIA_MAX_COUNT)
    location: PostLocationInput | None = None
    visibility: PostVisibility = PostVisibility.PUBLIC
    post_format: PostFormat | None = None
    allow_comments: bool = True
    allow_shares: bool = True
    scheduled_at: datetime | None = None
    location_label: str | None = Field(default=None, max_length=POST_LOCATION_LABEL_MAX_LENGTH)
    activity_label: str | None = Field(default=None, max_length=POST_ACTIVITY_LABEL_MAX_LENGTH)
    linked_tribe_id: uuid.UUID | None = None
    tagged_user_ids: list[uuid.UUID] = Field(default_factory=list, max_length=POST_TAGGED_USERS_MAX)
    audience_user_ids: list[uuid.UUID] = Field(default_factory=list, max_length=POST_TAGGED_USERS_MAX)
    poll: PostPollInput | None = None
    cross_post_targets: PostCrossPostTargetsInput | None = None
    use_media_caption: bool = False

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()

    @field_validator("scheduled_at")
    @classmethod
    def scheduled_must_be_future(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        if value <= datetime.now(UTC):
            raise ValueError("La programmation doit être dans le futur.")
        return value

    @model_validator(mode="after")
    def validate_composer(self) -> PostCreateRequest:
        if self.author_type == "organization" and self.organization_id is None:
            raise ValueError("organization_id requis pour un post organisation")
        if self.author_type == "citizen" and self.organization_id is not None:
            raise ValueError("organization_id interdit pour un post citoyen")
        if len(self.body) > POST_COMPOSER_BODY_MAX_LENGTH:
            raise ValueError(f"Texte limité à {POST_COMPOSER_BODY_MAX_LENGTH} caractères.")
        if self.visibility == PostVisibility.CUSTOM and not self.audience_user_ids:
            raise ValueError("Sélectionnez au moins une personne pour une audience personnalisée.")
        if self.post_format == PostFormat.POLL and self.poll is None:
            raise ValueError("Un sondage requiert une question et des options.")
        if self.poll is not None and self.post_format not in (PostFormat.POLL, None):
            if self.post_format != PostFormat.POLL:
                raise ValueError("poll incompatible avec ce format de publication.")
        return self


class PostMediaUploadResponse(BaseModel):
    url: str
    media_type: PostMediaTypeLiteral


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
    creator_content: FeedCreatorContentMeta | None = None
    neighborhood_summary: FeedNeighborhoodSummary | None = None
    composer: PostComposerMetaResponse | None = None
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
