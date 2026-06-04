"""Admin local event schemas (ADMIN-05C)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminLocalEventOrganizationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    verification_status: str
    visibility: str


class AdminLocalEventDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    city: str
    location_name: str
    address: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    timezone: str
    visibility: str
    moderation_status: str
    is_cancelled: bool
    interest_count: int = Field(ge=0)
    rejection_reason: str | None = None
    organization: AdminLocalEventOrganizationDetail | None = None
    created_at: datetime
    updated_at: datetime
