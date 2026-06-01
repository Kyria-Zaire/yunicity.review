"""Signed partners public routes (WEB-PARTNERS-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.partner_constants import (
    PARTNER_LIST_LIMIT_DEFAULT,
    PARTNER_STATUSES,
    PARTNERSHIP_TYPES,
    PartnershipType,
    PartnerStatus,
)
from app.core.passport_stamp_qr import generate_stamp_qr_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.local_event import LocalEventListResponse
from app.schemas.partner import PartnerListResponse, PartnerPublicDetail
from app.schemas.partner_creator_content_public import PartnerCreatorContentPublicListResponse
from app.schemas.partner_offer_public import PartnerOfferPublicListResponse
from app.schemas.passport_stamp_claim import StampQrGenerateRequest, StampQrGenerateResponse
from app.services.local_event_service import LocalEventService
from app.services.partner_service import PartnerService, default_partner_list_limit
from app.services.public_partner_creator_content_service import PublicPartnerCreatorContentService
from app.services.public_partner_offer_service import PublicPartnerOfferService

router = APIRouter(prefix="/partners", tags=["partners"])


def _parse_partner_status(value: str | None) -> PartnerStatus | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in PARTNER_STATUSES:
        return None
    return PartnerStatus(normalized)


def _parse_partnership_type(value: str | None) -> PartnershipType | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in PARTNERSHIP_TYPES:
        return None
    return PartnershipType(normalized)


@router.get("", response_model=PartnerListResponse)
async def list_partners(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    status: str | None = Query(default=None),
    type: str | None = Query(default=None, alias="type"),
    featured: bool = Query(default=False),
    limit: int = Query(default=PARTNER_LIST_LIMIT_DEFAULT, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PartnerListResponse:
    return await PartnerService(session).list_public(
        city=city,
        status=_parse_partner_status(status),
        partnership_type=_parse_partnership_type(type),
        featured_only=featured,
        limit=default_partner_list_limit(limit),
        offset=offset,
    )


@router.get("/{slug}/offers", response_model=PartnerOfferPublicListResponse)
async def list_partner_offers(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PartnerOfferPublicListResponse:
    return await PublicPartnerOfferService(session).list_for_partner_slug(
        city=city,
        slug=slug,
        limit=limit,
        offset=offset,
    )


@router.post("/{slug}/passport-qr", response_model=StampQrGenerateResponse)
async def generate_partner_passport_qr(
    slug: str,
    payload: Annotated[StampQrGenerateRequest, Body()],
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> StampQrGenerateResponse:
    profile = await PartnerService(session).get_profile_for_qr(
        slug=slug, city=city, user=current_user
    )
    token, expires_at = generate_stamp_qr_token(
        organization_id=str(profile.organization_id),
        partner_profile_id=str(profile.id),
        partner_offer_id=str(payload.partner_offer_id) if payload.partner_offer_id else None,
        expires_in_minutes=payload.expires_in_minutes,
    )
    qr_url = f"/passport/stamp/claim?token={token}"
    return StampQrGenerateResponse(qr_url=qr_url, expires_at=expires_at)


@router.get("/{slug}/creator-content", response_model=PartnerCreatorContentPublicListResponse)
async def list_partner_creator_content(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    limit: int = Query(default=12, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> PartnerCreatorContentPublicListResponse:
    return await PublicPartnerCreatorContentService(session).list_for_partner_slug(
        city=city,
        slug=slug,
        limit=limit,
        offset=offset,
    )


@router.get("/{slug}/events", response_model=LocalEventListResponse)
async def list_partner_events(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> LocalEventListResponse:
    return await LocalEventService(session).list_partner_events(
        slug=slug,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
    )


@router.get("/{slug}", response_model=PartnerPublicDetail)
async def get_partner(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> PartnerPublicDetail:
    return await PartnerService(session).get_public_by_slug(city=city, slug=slug)
