"""Passport HTTP routes — MVP foundation (TICKET-303)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query, Request
from fastapi import Response as FastAPIResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.passport_constants import PARTNER_OFFER_TYPES, PartnerOfferType
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner_offer_public import PartnerOfferPublicListResponse
from app.schemas.passport import (
    PassportActivateRequest,
    PassportMeResponse,
    PassportStampListResponse,
    PassportTierListResponse,
)
from app.schemas.passport_stamp_claim import StampClaimRequest, StampClaimResponse
from app.schemas.redemption import RedemptionResponse
from app.schemas.scan import PassportQrResponse
from app.services.passport_service import PassportService
from app.services.passport_stamp_claim_service import PassportStampClaimService
from app.services.public_partner_offer_service import (
    PublicPartnerOfferService,
)


def _parse_offer_type(value: str | None) -> PartnerOfferType | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in PARTNER_OFFER_TYPES:
        return None
    return PartnerOfferType(normalized)

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


@router.get("/me/qr", response_model=PassportQrResponse)
async def get_passport_qr(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportQrResponse:
    return await PassportService(session).get_qr(current_user)


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


@router.post("/stamps/claim", response_model=StampClaimResponse)
async def claim_passport_stamp(
    payload: StampClaimRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    response: FastAPIResponse,
) -> StampClaimResponse:
    await enforce_rate_limit(
        f"stamp:claim:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"stamp:claim:ip:{_client_ip(request)}",
        limit=60,
        window_seconds=3600,
    )
    result, created = await PassportStampClaimService(session).claim(current_user, payload.token)
    response.status_code = 201 if created else 200
    return result


@router.get("/offers", response_model=PartnerOfferPublicListResponse)
async def list_passport_offers(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(default=None, min_length=1, max_length=128),
    partner_slug: str | None = Query(default=None),
    featured: bool = Query(default=False),
    type: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PartnerOfferPublicListResponse:
    return await PublicPartnerOfferService(session).list_for_passport_user(
        current_user,
        city=city,
        partner_slug=partner_slug,
        featured_only=featured,
        offer_type=_parse_offer_type(type),
        limit=limit,
        offset=offset,
    )


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
