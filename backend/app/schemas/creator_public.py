"""Public creator hub schemas (FEATURE-CREATORS-V1 C1-01)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreatorPublicAuthor(BaseModel):
    """V1: partner organization. Future: kind=creator_profile."""

    kind: Literal["partner", "creator_profile"] = "partner"
    organization_id: UUID
    display_name: str = Field(min_length=1, max_length=256)
    slug: str = Field(min_length=1, max_length=128)


class CreatorPublicContentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    cover: str | None
    content_type: Literal["article", "photo"]
    city: str
    published_at: datetime
    body: str | None
    author: CreatorPublicAuthor


class CreatorPublicListResponse(BaseModel):
    items: list[CreatorPublicContentItem]
    total: int
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)
