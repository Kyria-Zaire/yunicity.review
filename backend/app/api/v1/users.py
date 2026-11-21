"""User settings routes (TICKET-503)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_optional, require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.feed import FeedListResponse
from app.schemas.neighborhood import NeighborhoodContributionMeListResponse
from app.schemas.profile import ProfilePublicResponse
from app.schemas.social_notification import (
    UserNotificationPreferencesResponse,
    UserNotificationPreferencesUpdate,
)
from app.schemas.tribe import TribeListResponse
from app.services.profile_public_context_service import ProfilePublicContextService
from app.services.profile_public_feed_service import ProfilePublicFeedService
from app.services.profile_service import ProfileService
from app.services.social_notification_service import SocialNotificationService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}/profile", response_model=ProfilePublicResponse)
async def get_public_profile_by_user_id(
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> ProfilePublicResponse:
    return await ProfileService(session).get_public_by_user_id(user_id, viewer=current_user)


@router.get("/{user_id}/posts", response_model=FeedListResponse)
async def get_public_profile_posts_by_user_id(
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> FeedListResponse:
    return await ProfilePublicFeedService(session).list_public_posts_by_user_id(
        user_id,
        viewer=current_user,
        limit=limit,
    )


@router.get("/{user_id}/contributions", response_model=NeighborhoodContributionMeListResponse)
async def get_public_profile_contributions_by_user_id(
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> NeighborhoodContributionMeListResponse:
    return await ProfilePublicContextService(session).list_public_contributions_by_user_id(
        user_id,
        viewer=current_user,
        limit=limit,
    )


@router.get("/{user_id}/tribes", response_model=TribeListResponse)
async def get_public_profile_tribes_by_user_id(
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> TribeListResponse:
    return await ProfilePublicContextService(session).list_public_tribes_by_user_id(
        user_id,
        viewer=current_user,
        limit=limit,
    )


@router.get("/me/preferences", response_model=UserNotificationPreferencesResponse)
async def get_my_notification_preferences(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserNotificationPreferencesResponse:
    return await SocialNotificationService(session).get_preferences(current_user)


@router.patch("/me/preferences", response_model=UserNotificationPreferencesResponse)
async def patch_my_notification_preferences(
    payload: UserNotificationPreferencesUpdate,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserNotificationPreferencesResponse:
    return await SocialNotificationService(session).update_preferences(current_user, payload)
