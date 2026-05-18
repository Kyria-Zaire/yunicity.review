"""Organization partner offer self-service routes (TICKET-305A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner_offer_management import (
    PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
    PartnerOfferCreateRequest,
    PartnerOfferManagementListResponse,
    PartnerOfferManagementResponse,
    PartnerOfferUpdateRequest,
)
from app.services.partner_offer_service import PartnerOfferService

router = APIRouter(prefix="/me", tags=["organization-offers"])


@router.post("/offers", response_model=PartnerOfferManagementResponse, status_code=201)
async def create_my_organization_offer(
    payload: PartnerOfferCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferManagementResponse:
    return await PartnerOfferService(session).create_draft(current_user, payload)


@router.get("/offers", response_model=PartnerOfferManagementListResponse)
async def list_my_organization_offers(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    organization_id: str | None = Query(default=None),
    status: str | None = Query(default=None, description="offer_status filter"),
    offer_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PARTNER_OFFER_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PARTNER_OFFER_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerOfferManagementListResponse:
    org_id = uuid.UUID(organization_id) if organization_id else None
    return await PartnerOfferService(session).list_my_offers(
        current_user,
        organization_id=org_id,
        offer_status=status,
        offer_type=offer_type,
        page=page,
        page_size=page_size,
    )


@router.patch("/offers/{offer_id}", response_model=PartnerOfferManagementResponse)
async def update_my_organization_offer(
    offer_id: uuid.UUID,
    payload: PartnerOfferUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferManagementResponse:
    return await PartnerOfferService(session).update_draft(current_user, offer_id, payload)


@router.post("/offers/{offer_id}/submit", response_model=PartnerOfferManagementResponse)
async def submit_my_organization_offer(
    offer_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerOfferManagementResponse:
    return await PartnerOfferService(session).submit_for_review(current_user, offer_id)
