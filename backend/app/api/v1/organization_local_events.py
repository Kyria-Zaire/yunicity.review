"""Organization local event self-service (TICKET-505)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.local_event_constants import (
    LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
    LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.local_event import (
    LocalEventCreateRequest,
    LocalEventManagementListResponse,
    LocalEventManagementResponse,
    LocalEventUpdateRequest,
)
from app.services.local_event_service import LocalEventService

router = APIRouter(prefix="/me", tags=["organization-events"])


@router.post("/events", response_model=LocalEventManagementResponse, status_code=201)
async def create_organization_event(
    payload: LocalEventCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalEventManagementResponse:
    return await LocalEventService(session).create_for_organization(current_user, payload)


@router.get("/events", response_model=LocalEventManagementListResponse)
async def list_organization_events(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    organization_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    ),
) -> LocalEventManagementListResponse:
    org_id = uuid.UUID(organization_id) if organization_id else None
    return await LocalEventService(session).list_my_events(
        current_user,
        organization_id=org_id,
        page=page,
        page_size=page_size,
    )


@router.patch("/events/{event_id}", response_model=LocalEventManagementResponse)
async def update_organization_event(
    event_id: uuid.UUID,
    payload: LocalEventUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalEventManagementResponse:
    return await LocalEventService(session).update_for_organization(
        current_user, event_id, payload
    )


@router.post("/events/{event_id}/submit", response_model=LocalEventManagementResponse)
async def submit_organization_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> LocalEventManagementResponse:
    return await LocalEventService(session).submit_for_review(current_user, event_id)
