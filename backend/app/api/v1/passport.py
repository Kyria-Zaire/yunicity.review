"""Passport HTTP routes — MVP foundation (TICKET-303)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner_offer import PartnerOfferListResponse
from app.schemas.passport import (
    PassportActivateRequest,
    PassportMeResponse,
    PassportStampListResponse,
    PassportTierListResponse,
)
from app.schemas.redemption import RedemptionResponse
from app.services.passport_service import PassportService

router = APIRouter(prefix="/passport", tags=["passport"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.get("/tiers", response_model=PassportTierListResponse)
async def list_passport_tiers(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportTierListResponse:
    return await PassportService(session).list_public_tiers()


@router.get("/me", response_model=PassportMeResponse)
async def get_passport_me(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportMeResponse:
    return await PassportService(session).get_me(current_user)


@router.post("/activate", response_model=PassportMeResponse)
async def activate_passport(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    payload: Annotated[PassportActivateRequest | None, Body()] = None,
) -> PassportMeResponse:
    return await PassportService(session).activate(
        current_user,
        payload or PassportActivateRequest(),
    )


@router.get("/stamps", response_model=PassportStampListResponse)
async def list_passport_stamps(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportStampListResponse:
    return await PassportService(session).list_stamps(current_user)


@router.get("/offers", response_model=PartnerOfferListResponse)
async def list_passport_offers(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferListResponse:
    return await PassportService(session).list_visible_offers(current_user)


@router.post("/offers/{offer_id}/redeem", response_model=RedemptionResponse)
async def redeem_passport_offer(
    offer_id: uuid.UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> RedemptionResponse:
    await enforce_rate_limit(
        f"passport:redeem:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"passport:redeem:ip:{_client_ip(request)}",
        limit=40,
        window_seconds=3600,
    )
    return await PassportService(session).redeem_offer(current_user, offer_id)
