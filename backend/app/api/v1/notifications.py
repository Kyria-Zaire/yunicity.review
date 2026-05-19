"""Push notification routes (TICKET-307)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.notifications import (
    PushSubscriptionListResponse,
    PushSubscriptionResponse,
    RegisterDeviceRequest,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post(
    "/register-device",
    response_model=PushSubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_push_device(
    payload: RegisterDeviceRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PushSubscriptionResponse:
    await enforce_rate_limit(
        f"push:register:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"push:register:ip:{_client_ip(request)}",
        limit=40,
        window_seconds=3600,
    )
    return await NotificationService(session).register_device(current_user, payload)


@router.get("/me/subscriptions", response_model=PushSubscriptionListResponse)
async def list_my_push_subscriptions(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PushSubscriptionListResponse:
    return await NotificationService(session).list_my_subscriptions(current_user)


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_push_subscription(
    subscription_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await NotificationService(session).delete_subscription(current_user, subscription_id)
