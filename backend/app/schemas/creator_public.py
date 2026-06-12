"""Public creator hub schemas (FEATURE-CREATORS-V1 C1-01)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.partner_constants import PartnershipType, PartnerStatus


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


class CreatorPublicDetailResponse(CreatorPublicContentItem):
    """Public detail — same fields as list item plus related suggestions."""

    related: list[CreatorPublicContentItem] = Field(default_factory=list)


class CreatorPublicTerritory(BaseModel):
    city: str = Field(min_length=1, max_length=128)
    neighborhood_name: str | None = Field(default=None, max_length=120)


class CreatorPublicProfileStats(BaseModel):
    published_content_count: int = Field(ge=0)


class CreatorPublicDirectoryItem(BaseModel):
    """Public creator directory card (C1-04). V1: partner organization as creator."""

    id: UUID
    kind: Literal["partner", "creator_profile"] = "partner"
    display_name: str = Field(min_length=1, max_length=256)
    slug: str = Field(min_length=1, max_length=128)
    description: str | None = None
    logo_url: str | None = None
    territory: CreatorPublicTerritory
    partnership_type: PartnershipType | None = None
    partner_status: PartnerStatus | None = None
    published_content_count: int = Field(ge=1)


class CreatorPublicDirectoryListResponse(BaseModel):
    city: str = Field(min_length=1, max_length=128)
    items: list[CreatorPublicDirectoryItem]
    total: int = Field(ge=0)
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)


class CreatorPublicProfileResponse(BaseModel):
    """Public creator profile (C1-03). V1: partner organization as creator."""

    id: UUID
    kind: Literal["partner", "creator_profile"] = "partner"
    display_name: str = Field(min_length=1, max_length=256)
    slug: str = Field(min_length=1, max_length=128)
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    territory: CreatorPublicTerritory
    stats: CreatorPublicProfileStats
    contents: list[CreatorPublicContentItem] = Field(default_factory=list)
    contents_total: int = Field(ge=0)
    contents_limit: int = Field(ge=1)
    contents_offset: int = Field(ge=0)
