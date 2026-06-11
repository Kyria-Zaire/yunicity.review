"""Admin activity center — staff only (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_activity_constants import (
    ACTIVITY_FEED_CATEGORIES,
    ACTIVITY_FEED_LIMIT_DEFAULT,
    ACTIVITY_FEED_LIMIT_MAX,
)
from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_activity import (
    AdminActivityFeedResponse,
    AdminActivitySummaryResponse,
)
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY
from app.services.admin_activity_service import AdminActivityService

router = APIRouter(prefix="/admin/activity", tags=["admin-activity"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("/summary", response_model=AdminActivitySummaryResponse)
async def get_admin_activity_summary(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(
        default=None,
        max_length=128,
        description=f"Ville pilote (défaut : {DEFAULT_COCKPIT_CITY})",
    ),
) -> AdminActivitySummaryResponse:
    _ = current_user
    return await AdminActivityService(session).get_summary(city=city)


@router.get("/feed", response_model=AdminActivityFeedResponse)
async def get_admin_activity_feed(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: Annotated[
        int,
        Query(ge=1, le=ACTIVITY_FEED_LIMIT_MAX),
    ] = ACTIVITY_FEED_LIMIT_DEFAULT,
    cursor: str | None = Query(default=None, max_length=512),
    category: Annotated[
        str,
        Query(description="Filtrer par catégorie d'activité"),
    ] = "all",
) -> AdminActivityFeedResponse:
    if category not in ACTIVITY_FEED_CATEGORIES:
        raise HTTPException(status_code=422, detail="Invalid activity category")
    return await AdminActivityService(session).get_feed(
        viewer=current_user,
        limit=limit,
        cursor=cursor,
        category=category,
    )
