"""Local Video API schemas (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.local_video_constants import (
    ALLOWED_LOCAL_VIDEO_CONTENT_TYPES,
    LOCAL_VIDEO_COMMENT_BODY_MAX_LENGTH,
    LOCAL_VIDEO_DEFAULT_CITY,
    LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH,
    LOCAL_VIDEO_MAX_BYTES,
    LOCAL_VIDEO_TITLE_MAX_LENGTH,
    LocalVideoReportReason,
    LocalVideoStatus,
    LocalVideoType,
)


class LocalVideoUploadInitRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str
    file_size_bytes: int = Field(gt=0)

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_LOCAL_VIDEO_CONTENT_TYPES:
            raise ValueError("Type de fichier vidéo non supporté.")
        return normalized

    @field_validator("file_size_bytes")
    @classmethod
    def validate_file_size(cls, value: int) -> int:
        if value > LOCAL_VIDEO_MAX_BYTES:
            raise ValueError("Fichier trop volumineux.")
        return value


class LocalVideoUploadInitResponse(BaseModel):
    upload_id: uuid.UUID
    presigned_url: str
    storage_key: str
    expires_at: datetime
    upload_method: str
    upload_headers: dict[str, str]


class LocalVideoPublishRequest(BaseModel):
    upload_id: uuid.UUID
    city: str = Field(default=LOCAL_VIDEO_DEFAULT_CITY, min_length=1, max_length=64)
    neighborhood_id: uuid.UUID
    video_type: LocalVideoType
    title: str | None = Field(default=None, max_length=LOCAL_VIDEO_TITLE_MAX_LENGTH)
    description: str | None = Field(
        default=None,
        max_length=LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH,
    )
    cultural_place_id: uuid.UUID | None = None
    local_event_id: uuid.UUID | None = None
    tribe_id: uuid.UUID | None = None
    organization_id: uuid.UUID | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class LocalVideoItem(BaseModel):
    id: uuid.UUID
    author_user_id: uuid.UUID
    city: str
    neighborhood_id: uuid.UUID
    video_type: LocalVideoType
    title: str | None
    description: str | None
    cultural_place_id: uuid.UUID | None
    local_event_id: uuid.UUID | None
    tribe_id: uuid.UUID | None
    organization_id: uuid.UUID | None
    media_url: str
    thumbnail_url: str
    duration_seconds: float
    file_size_bytes: int
    mime_type: str
    latitude: float | None
    longitude: float | None
    status: LocalVideoStatus
    processing_error: str | None
    published_at: datetime | None
    created_at: datetime


class LocalVideoFeedAuthor(BaseModel):
    id: uuid.UUID
    username: str | None
    full_name: str
    avatar_url: str | None


class LocalVideoFeedItem(BaseModel):
    id: uuid.UUID
    author_user_id: uuid.UUID
    author: LocalVideoFeedAuthor
    city: str
    neighborhood_id: uuid.UUID
    neighborhood_name: str
    neighborhood_slug: str
    video_type: LocalVideoType
    title: str | None
    description: str | None
    cultural_place_id: uuid.UUID | None
    cultural_place_slug: str | None
    cultural_place_name: str | None
    local_event_id: uuid.UUID | None
    tribe_id: uuid.UUID | None
    organization_id: uuid.UUID | None
    media_url: str
    thumbnail_url: str
    duration_seconds: float
    mime_type: str
    latitude: float | None
    longitude: float | None
    status: LocalVideoStatus
    published_at: datetime | None
    created_at: datetime
    distance_meters: int | None
    walk_minutes: int | None
    like_count: int
    comment_count: int
    liked_by_me: bool = False


class LocalVideoFeedResponse(BaseModel):
    items: list[LocalVideoFeedItem]
    next_cursor: str | None
    city: str


class LocalVideoLikeResponse(BaseModel):
    liked: bool
    like_count: int


class LocalVideoCommentCreateRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=LOCAL_VIDEO_COMMENT_BODY_MAX_LENGTH)

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        return value.strip()


class LocalVideoCommentResponse(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    author_user_id: uuid.UUID
    author_display_name: str
    author_username: str | None
    body: str
    created_at: datetime
    updated_at: datetime


class LocalVideoCommentListResponse(BaseModel):
    items: list[LocalVideoCommentResponse]
    next_cursor: str | None = None


class LocalVideoReportCreateRequest(BaseModel):
    reason: LocalVideoReportReason
