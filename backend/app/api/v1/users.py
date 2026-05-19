"""User settings routes (TICKET-503)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.social_notification import (
    UserNotificationPreferencesResponse,
    UserNotificationPreferencesUpdate,
)
from app.services.social_notification_service import SocialNotificationService

router = APIRouter(prefix="/users", tags=["users"])


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
