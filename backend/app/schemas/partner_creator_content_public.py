"""Public partner creator content schemas (WEB-PARTNERS-06B)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PartnerCreatorContentPublicItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    body: str | None
    media_url: str | None
    published_at: datetime


class PartnerCreatorContentPublicListResponse(BaseModel):
    items: list[PartnerCreatorContentPublicItem]
    total: int
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)
