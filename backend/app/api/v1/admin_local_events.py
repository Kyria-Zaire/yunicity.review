"""Admin local event moderation (TICKET-505)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.local_event_constants import (
    LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
    LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_local_event import AdminLocalEventDetailResponse
from app.schemas.local_event import (
    LocalEventManagementListResponse,
    LocalEventManagementResponse,
    LocalEventRejectRequest,
)
from app.services.admin_local_event_service import AdminLocalEventService
from app.services.local_event_service import LocalEventService

router = APIRouter(prefix="/admin/local-events", tags=["admin-local-events"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=LocalEventManagementListResponse)
async def list_local_events_admin(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(default=None, description="moderation_status filter"),
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    ),
) -> LocalEventManagementListResponse:
    _ = current_user
    return await LocalEventService(session).list_admin(
        moderation_status=status,
        city=city,
        page=page,
        page_size=page_size,
    )


@router.get("/{event_id}", response_model=AdminLocalEventDetailResponse)
async def get_local_event_admin(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminLocalEventDetailResponse:
    _ = current_user
    return await AdminLocalEventService(session).get_event_detail(event_id)


@router.post("/{event_id}/approve", response_model=LocalEventManagementResponse)
async def approve_local_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalEventManagementResponse:
    return await LocalEventService(session).approve_event(current_user, event_id)


@router.post("/{event_id}/reject", response_model=LocalEventManagementResponse)
async def reject_local_event(
    event_id: uuid.UUID,
    payload: LocalEventRejectRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalEventManagementResponse:
    return await LocalEventService(session).reject_event(current_user, event_id, payload)
