"""Local stories portal (WEB-STORIES-01)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import require_authenticated_user
from app.core.rate_limit import enforce_rate_limit
from app.core.story_constants import (
    STORY_PAGE_SIZE_DEFAULT,
    STORY_PAGE_SIZE_MAX,
    StoryCategory,
    StoryTab,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.story import (
    StoryCreateRequest,
    StoryInsightsResponse,
    StoryItem,
    StoryListResponse,
    StoryMediaUploadResponse,
    StoryRingsResponse,
)
from app.services.story_media_service import StoryMediaService
from app.services.story_service import StoryService

router = APIRouter(prefix="/stories", tags=["stories"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.get("", response_model=StoryListResponse)
async def list_stories(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    tab: StoryTab = StoryTab.FOR_YOU,
    category: StoryCategory = StoryCategory.ALL,
    cursor: str | None = None,
    limit: int = Query(default=STORY_PAGE_SIZE_DEFAULT, ge=1, le=STORY_PAGE_SIZE_MAX),
) -> StoryListResponse:
    return await StoryService(session).list_stories(
        current_user,
        tab=tab,
        category=category,
        cursor=cursor,
        limit=limit,
    )


@router.get("/rings", response_model=StoryRingsResponse)
async def list_story_rings(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> StoryRingsResponse:
    return await StoryService(session).list_rings(current_user)


@router.get("/insights", response_model=StoryInsightsResponse)
async def get_story_insights(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> StoryInsightsResponse:
    return await StoryService(session).get_insights(current_user)


@router.post("/media", response_model=StoryMediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_story_media(
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    file: Annotated[UploadFile, File()],
) -> StoryMediaUploadResponse:
    # Same thresholds as profile media uploads (avatar/banner).
    await enforce_rate_limit(
        f"stories:media:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"stories:media:ip:{_client_ip(request)}",
        limit=40,
        window_seconds=3600,
    )
    settings = get_settings()
    url, media_type = await StoryMediaService(settings).upload(current_user, file)
    return StoryMediaUploadResponse(url=url, media_type=media_type)


@router.post("", response_model=StoryItem, status_code=status.HTTP_201_CREATED)
async def create_story(
    payload: StoryCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> StoryItem:
    return await StoryService(session).create_story(current_user, payload)


@router.post("/{story_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def record_story_view(
    story_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await StoryService(session).record_view(current_user, story_id)
