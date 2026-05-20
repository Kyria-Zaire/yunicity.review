"""Staff tribe management (TICKET-A.2)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.tribe import TribeCreateRequest, TribeListResponse, TribeResponse
from app.services.tribe_service import TribeService

router = APIRouter(prefix="/admin/tribes", tags=["admin-tribes"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=TribeListResponse)
async def admin_list_tribes(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=50),
) -> TribeListResponse:
    _ = current_user
    return await TribeService(session).list_public(
        city=city,
        featured_only=False,
        page=page,
        page_size=page_size,
        viewer=None,
    )


@router.post("", response_model=TribeResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_tribe(
    payload: TribeCreateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TribeResponse:
    return await TribeService(session).create(current_user, payload)


@router.post("/{slug}/archive", response_model=TribeResponse)
async def admin_archive_tribe(
    slug: str,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> TribeResponse:
    return await TribeService(session).archive(current_user, city=city, slug=slug)
