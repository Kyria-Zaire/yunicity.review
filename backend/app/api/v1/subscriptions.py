"""Citizen membership subscriptions (WEB-SUBSCRIPTIONS-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionCommunityStatsResponse,
    SubscriptionMeResponse,
    SubscriptionPlansResponse,
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=SubscriptionPlansResponse)
async def list_subscription_plans(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionPlansResponse:
    return await SubscriptionService(session).list_plans()


@router.get("/community-stats", response_model=SubscriptionCommunityStatsResponse)
async def subscription_community_stats(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionCommunityStatsResponse:
    return await SubscriptionService(session).community_stats()


@router.get("/me", response_model=SubscriptionMeResponse)
async def get_my_subscription(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionMeResponse:
    return await SubscriptionService(session).get_me(current_user)


@router.post("/checkout", response_model=SubscriptionCheckoutResponse)
async def start_subscription_checkout(
    payload: SubscriptionCheckoutRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionCheckoutResponse:
    return await SubscriptionService(session).create_checkout(current_user, payload)
