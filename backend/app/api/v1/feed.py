"""Citizen feed routes (TICKET-402)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.feed_constants import FEED_PAGE_SIZE_DEFAULT, FEED_PAGE_SIZE_MAX
from app.db.session import get_db
from app.models.user import User
from app.schemas.feed import FeedListResponse
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedListResponse)
async def get_feed(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    cursor: str | None = None,
    limit: int = Query(default=FEED_PAGE_SIZE_DEFAULT, ge=1, le=FEED_PAGE_SIZE_MAX),
) -> FeedListResponse:
    return await FeedService(session).list_feed(current_user, cursor=cursor, limit=limit)
