"""Local events API schemas (TICKET-505)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.local_event_constants import (
    LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
    MVP_LOCAL_EVENT_TYPES,
)
from app.schemas.event_readiness import EventReadinessFields
from app.schemas.neighborhood import FeedNeighborhoodSummary


class LocalEventOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None
    is_verified: bool = False
    is_partner: bool = False
    partner_status: str | None = None
    created_at: datetime | None = None


class LocalEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID | None
    title: str
    description: str | None
    event_type: str | None
    city: str
    district: str | None
    starts_at: datetime
    ends_at: datetime | None
    timezone: str
    location_name: str
    address: str | None
    latitude: float | None = None
    longitude: float | None = None
    cover_image_url: str | None
    moderation_status: str
    is_cancelled: bool
    interested_by_me: bool = False
    interest_count: int = 0
    organization: LocalEventOrganizationSummary | None = None
    neighborhood_summary: FeedNeighborhoodSummary | None = None
    created_at: datetime


class LocalEventListResponse(BaseModel):
    items: list[LocalEventResponse]
    total: int
    page: int = 1
    page_size: int = LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT


class LocalEventCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    organization_id: uuid.UUID
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    event_type: str | None = Field(default=None, max_length=64)
    city: str = Field(min_length=2, max_length=128)
    district: str | None = Field(default=None, max_length=128)
    starts_at: datetime
    ends_at: datetime | None = None
    timezone: str = Field(default="Europe/Paris", max_length=64)
    location_name: str = Field(min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=300)
    latitude: float | None = None
    longitude: float | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)


class LocalEventUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    event_type: str | None = Field(default=None, max_length=64)
    district: str | None = Field(default=None, max_length=128)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location_name: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=300)
    latitude: float | None = None
    longitude: float | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)


class LocalEventManagementResponse(LocalEventResponse):
    rejection_reason: str | None = None
    readiness: EventReadinessFields


class LocalEventManagementListResponse(BaseModel):
    items: list[LocalEventManagementResponse]
    total: int
    page: int
    page_size: int


class LocalEventRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=3, max_length=500)


class EventInterestToggleResponse(BaseModel):
    event_id: uuid.UUID
    interested: bool
    interest_count: int = 0


class LocalEventTypeListResponse(BaseModel):
    items: list[str] = Field(default_factory=lambda: list(MVP_LOCAL_EVENT_TYPES))
