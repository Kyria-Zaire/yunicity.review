"""Public creator hub routes (FEATURE-CREATORS-V1 C1-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.creator_public_constants import (
    CREATOR_HUB_LIST_LIMIT_DEFAULT,
    CREATOR_HUB_LIST_LIMIT_MAX,
)
from app.db.session import get_db
from app.schemas.creator_public import CreatorPublicListResponse
from app.services.public_creator_hub_service import PublicCreatorHubService

router = APIRouter(prefix="/creator-content", tags=["creator-content-public"])


@router.get("", response_model=CreatorPublicListResponse)
async def list_public_creator_content(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    limit: int = Query(default=CREATOR_HUB_LIST_LIMIT_DEFAULT, ge=1, le=CREATOR_HUB_LIST_LIMIT_MAX),
    offset: int = Query(default=0, ge=0),
) -> CreatorPublicListResponse:
    return await PublicCreatorHubService(session).list_for_city(
        city=city,
        limit=limit,
        offset=offset,
    )
