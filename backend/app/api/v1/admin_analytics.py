"""Admin analytics aggregate summary — staff only (ADMIN-ANALYTICS-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_analytics import (
    AdminAnalyticsPeriod,
    AdminAnalyticsSummaryResponse,
)
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY
from app.services.admin_analytics_service import AdminAnalyticsService

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("/summary", response_model=AdminAnalyticsSummaryResponse)
async def get_admin_analytics_summary(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(
        default=None,
        max_length=128,
        description=f"Ville pilote (défaut : {DEFAULT_COCKPIT_CITY})",
    ),
    period: Annotated[
        AdminAnalyticsPeriod,
        Query(description="Fenêtre d'analyse : 7d, 30d ou 90d"),
    ] = "30d",
    compare: Annotated[
        bool,
        Query(description="Comparer la croissance avec la période précédente"),
    ] = True,
) -> AdminAnalyticsSummaryResponse:
    _ = current_user
    return await AdminAnalyticsService(session).get_summary(
        city=city,
        period=period,
        compare_enabled=compare,
    )
