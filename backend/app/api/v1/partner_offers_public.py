"""Public partner offers catalog (WEB-PARTNERS-03 / 08B)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passport_constants import PARTNER_OFFER_TYPES, PartnerOfferType
from app.db.session import get_db
from app.schemas.partner_offer_public import PartnerOfferPublicListResponse
from app.services.public_partner_offer_service import PublicPartnerOfferService

router = APIRouter(prefix="/partner-offers", tags=["partner-offers"])


def _parse_offer_type(value: str | None) -> PartnerOfferType | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in PARTNER_OFFER_TYPES:
        return None
    return PartnerOfferType(normalized)


@router.get("", response_model=PartnerOfferPublicListResponse)
async def list_partner_offers_catalog(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    partner_slug: str | None = Query(default=None),
    featured: bool = Query(default=False),
    type: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PartnerOfferPublicListResponse:
    return await PublicPartnerOfferService(session).list_catalog(
        city=city,
        partner_slug=partner_slug,
        featured_only=featured,
        offer_type=_parse_offer_type(type),
        limit=limit,
        offset=offset,
    )
