"""Signed partners public routes (WEB-PARTNERS-01)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.partner_constants import (
    PARTNER_LIST_LIMIT_DEFAULT,
    PARTNER_STATUSES,
    PARTNERSHIP_TYPES,
    PartnershipType,
    PartnerStatus,
)
from app.db.session import get_db
from app.schemas.partner import PartnerListResponse, PartnerPublicDetail
from app.services.partner_service import PartnerService, default_partner_list_limit

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


@router.get("/{slug}", response_model=PartnerPublicDetail)
async def get_partner(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> PartnerPublicDetail:
    return await PartnerService(session).get_public_by_slug(city=city, slug=slug)
