"""Citizen neighborhood contributions history (FEATURE-QUARTIERS-V2 / Q2-S3-02)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.neighborhood import NeighborhoodContributionMeListResponse
from app.services.neighborhood_contribution_service import NeighborhoodContributionService

router = APIRouter(tags=["neighborhood-contributions-me"])


@router.get(
    "/me/neighborhood-contributions",
    response_model=NeighborhoodContributionMeListResponse,
)
async def list_my_neighborhood_contributions(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> NeighborhoodContributionMeListResponse:
    return await NeighborhoodContributionService(session).list_user_contributions(current_user)
