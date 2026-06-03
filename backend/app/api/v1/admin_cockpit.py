"""Admin cockpit aggregate summary — staff only (ADMIN-01A)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_cockpit import (
    DEFAULT_COCKPIT_CITY,
    AdminCockpitSummaryResponse,
)
from app.services.admin_cockpit_service import AdminCockpitService

router = APIRouter(prefix="/admin/cockpit", tags=["admin-cockpit"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("/summary", response_model=AdminCockpitSummaryResponse)
async def get_admin_cockpit_summary(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(
        default=None,
        max_length=128,
        description=f"Ville pilote (défaut : {DEFAULT_COCKPIT_CITY})",
    ),
) -> AdminCockpitSummaryResponse:
    _ = current_user
    return await AdminCockpitService(session).get_summary(city=city)
