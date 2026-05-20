"""Search API schemas (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.core.search_constants import SEARCH_RANKING_EXPLANATION, SearchEntityType


class SearchResultItem(BaseModel):
    """Hit within a typed group — no mixed-feed discriminant."""

    id: uuid.UUID
    rank: float = Field(ge=0)
    title: str | None = None
    name: str | None = None
    slug: str | None = None
    city: str | None = None
    body: str | None = None
    username: str | None = None
    starts_at: datetime | None = None
    is_flash: bool | None = None


class SearchResultGroup(BaseModel):
    items: list[SearchResultItem]
    count: int = Field(ge=0, description="Total matches for this type (may exceed len(items)).")
    has_more: bool = False


class SearchGroups(BaseModel):
    """Grouped results — fixed keys, never a flat mixed feed."""

    events: SearchResultGroup
    organizations: SearchResultGroup
    posts: SearchResultGroup
    offers: SearchResultGroup
    tribes: SearchResultGroup
    users: SearchResultGroup
    neighborhoods: SearchResultGroup


class SearchResponse(BaseModel):
    query: str
    city: str
    neighborhood_slug: str | None = None
    type_filter: SearchEntityType | Literal["all"] = "all"
    ranking_explanation: str = SEARCH_RANKING_EXPLANATION
    groups: SearchGroups
    page: int = 1
    page_size: int = 20
    has_more: bool = False
