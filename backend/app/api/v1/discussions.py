"""Local discussions portal (WEB-DISCUSSIONS-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.discussion_constants import (
    DISCUSSION_PAGE_SIZE_DEFAULT,
    DISCUSSION_PAGE_SIZE_MAX,
    DiscussionCategory,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.discussion import (
    DiscussionCreateRequest,
    DiscussionInsightsResponse,
    DiscussionListResponse,
    DiscussionThreadItem,
)
from app.services.discussion_service import DiscussionService

router = APIRouter(prefix="/discussions", tags=["discussions"])


@router.post("", response_model=DiscussionThreadItem, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    payload: DiscussionCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> DiscussionThreadItem:
    return await DiscussionService(session).create_discussion(current_user, payload)


@router.get("", response_model=DiscussionListResponse)
async def list_discussions(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    category: DiscussionCategory = DiscussionCategory.ALL,
    cursor: str | None = None,
    limit: int = Query(default=DISCUSSION_PAGE_SIZE_DEFAULT, ge=1, le=DISCUSSION_PAGE_SIZE_MAX),
    require_comments: bool = False,
) -> DiscussionListResponse:
    return await DiscussionService(session).list_discussions(
        current_user,
        category=category,
        cursor=cursor,
        limit=limit,
        require_comments=require_comments,
    )


@router.get("/insights", response_model=DiscussionInsightsResponse)
async def get_discussion_insights(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> DiscussionInsightsResponse:
    return await DiscussionService(session).get_insights(current_user)
