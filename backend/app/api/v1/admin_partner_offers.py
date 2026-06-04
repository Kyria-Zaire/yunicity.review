"""Admin partner offer moderation routes — staff only (TICKET-305A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_partner_offer import (
    ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_DEFAULT,
    ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_MAX,
    PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
    PartnerOfferAdminCreateRequest,
    PartnerOfferAdminListResponse,
    PartnerOfferAdminRedemptionListResponse,
    PartnerOfferAdminResponse,
    PartnerOfferAdminUpdateRequest,
    PartnerOfferRejectRequest,
    VerifiedOrganizationListResponse,
)
from app.services.admin_partner_offer_service import AdminPartnerOfferService
from app.services.partner_offer_service import PartnerOfferService

router = APIRouter(prefix="/admin/partner-offers", tags=["admin-partner-offers"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("/verified-organizations", response_model=VerifiedOrganizationListResponse)
async def list_verified_organizations_for_offers(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> VerifiedOrganizationListResponse:
    _ = current_user
    return await PartnerOfferService(session).list_verified_organizations()


@router.post("", response_model=PartnerOfferAdminResponse, status_code=201)
async def create_partner_offer_admin(
    payload: PartnerOfferAdminCreateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    return await PartnerOfferService(session).create_offer_admin(current_user, payload)


@router.get("", response_model=PartnerOfferAdminListResponse)
async def list_partner_offers_admin(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(
        default=None,
        description="offer_status filter (pending_review, published, …)",
    ),
    offer_type: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerOfferAdminListResponse:
    _ = current_user
    org_id = uuid.UUID(organization_id) if organization_id else None
    return await PartnerOfferService(session).list_offers_admin(
        offer_status=status,
        offer_type=offer_type,
        organization_id=org_id,
        page=page,
        page_size=page_size,
    )


@router.get("/{offer_id}", response_model=PartnerOfferAdminResponse)
async def get_partner_offer_admin(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    _ = current_user
    return await PartnerOfferService(session).get_offer_admin(offer_id)


@router.get("/{offer_id}/redemptions", response_model=PartnerOfferAdminRedemptionListResponse)
async def list_partner_offer_redemptions_admin(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_OFFER_REDEMPTION_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerOfferAdminRedemptionListResponse:
    _ = current_user
    return await AdminPartnerOfferService(session).list_offer_redemptions(
        offer_id=offer_id,
        page=page,
        page_size=page_size,
    )


@router.patch("/{offer_id}", response_model=PartnerOfferAdminResponse)
async def update_partner_offer_admin(
    offer_id: uuid.UUID,
    payload: PartnerOfferAdminUpdateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    _ = current_user
    return await PartnerOfferService(session).update_offer_admin(offer_id, payload)


@router.post("/{offer_id}/approve", response_model=PartnerOfferAdminResponse)
async def approve_partner_offer(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    return await PartnerOfferService(session).approve_offer(current_user, offer_id)


@router.post("/{offer_id}/reject", response_model=PartnerOfferAdminResponse)
async def reject_partner_offer(
    offer_id: uuid.UUID,
    payload: PartnerOfferRejectRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    return await PartnerOfferService(session).reject_offer(current_user, offer_id, payload)


@router.post("/{offer_id}/archive", response_model=PartnerOfferAdminResponse)
async def archive_partner_offer(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferAdminResponse:
    return await PartnerOfferService(session).archive_offer(current_user, offer_id)
