"""Public local events routes (TICKET-505)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_optional, require_authenticated_user
from app.core.local_event_constants import (
    LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
    LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.local_event import (
    EventInterestToggleResponse,
    LocalEventListResponse,
    LocalEventResponse,
    LocalEventTypeListResponse,
)
from app.services.local_event_service import LocalEventService

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/types", response_model=LocalEventTypeListResponse)
async def list_event_types() -> LocalEventTypeListResponse:
    return LocalEventTypeListResponse()


@router.get("", response_model=LocalEventListResponse)
async def list_local_events(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    city: str | None = Query(default=None),
    organization_slug: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    ),
) -> LocalEventListResponse:
    return await LocalEventService(session).list_public(
        current_user,
        city=city,
        page=page,
        page_size=page_size,
        organization_slug=organization_slug,
    )


@router.get("/me/saved", response_model=LocalEventListResponse)
async def list_saved_events(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX),
) -> LocalEventListResponse:
    return await LocalEventService(session).list_saved(current_user, limit=limit)


@router.get("/{event_id}", response_model=LocalEventResponse)
async def get_local_event(
    event_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> LocalEventResponse:
    return await LocalEventService(session).get_public(event_id, current_user)


@router.post("/{event_id}/interest", response_model=EventInterestToggleResponse)
async def toggle_event_interest(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> EventInterestToggleResponse:
    return await LocalEventService(session).toggle_interest(current_user, event_id)
