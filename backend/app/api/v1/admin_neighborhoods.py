"""Staff neighborhood catalog management (TICKET-602)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.neighborhood import (
    NeighborhoodCreateRequest,
    NeighborhoodResponse,
    NeighborhoodUpdateRequest,
)
from app.services.neighborhood_service import NeighborhoodService

router = APIRouter(prefix="/admin/neighborhoods", tags=["admin-neighborhoods"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.post("", response_model=NeighborhoodResponse, status_code=status.HTTP_201_CREATED)
async def create_neighborhood(
    payload: NeighborhoodCreateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> NeighborhoodResponse:
    _ = current_user
    return await NeighborhoodService(session).create_admin(payload)


@router.patch("/{slug}", response_model=NeighborhoodResponse)
async def update_neighborhood(
    slug: str,
    payload: NeighborhoodUpdateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1, description="Ville (ex. Reims)"),
) -> NeighborhoodResponse:
    _ = current_user
    return await NeighborhoodService(session).update_admin(city=city, slug=slug, payload=payload)


@router.delete("/{slug}", response_model=NeighborhoodResponse)
async def deactivate_neighborhood(
    slug: str,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1, description="Ville (ex. Reims)"),
) -> NeighborhoodResponse:
    _ = current_user
    return await NeighborhoodService(session).deactivate_admin(city=city, slug=slug)
