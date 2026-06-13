"""Admin neighborhood contribution moderation (FEATURE-QUARTIERS-V2 / Q2-S3-02)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.neighborhood import (
    NeighborhoodContributionModerationResponse,
    NeighborhoodContributionRejectRequest,
)
from app.services.neighborhood_contribution_service import NeighborhoodContributionService

router = APIRouter(
    prefix="/admin/neighborhood-contributions",
    tags=["admin-neighborhood-contributions"],
)

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.post(
    "/{contribution_id}/approve",
    response_model=NeighborhoodContributionModerationResponse,
)
async def approve_neighborhood_contribution(
    contribution_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> NeighborhoodContributionModerationResponse:
    return await NeighborhoodContributionService(session).approve_contribution(
        admin=current_user,
        contribution_id=contribution_id,
    )


@router.post(
    "/{contribution_id}/reject",
    response_model=NeighborhoodContributionModerationResponse,
)
async def reject_neighborhood_contribution(
    contribution_id: uuid.UUID,
    payload: NeighborhoodContributionRejectRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> NeighborhoodContributionModerationResponse:
    return await NeighborhoodContributionService(session).reject_contribution(
        admin=current_user,
        contribution_id=contribution_id,
        payload=payload,
    )
