"""Partner lead CRM HTTP routes — staff only, no public endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.partner_lead_constants import (
    PARTNER_LEAD_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_LEAD_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner_lead import (
    PartnerLeadConvertRequest,
    PartnerLeadCreateRequest,
    PartnerLeadImportPreviewRequest,
    PartnerLeadImportPreviewResponse,
    PartnerLeadListResponse,
    PartnerLeadResponse,
    PartnerLeadUpdateRequest,
)
from app.services.partner_lead_service import PartnerLeadService

router = APIRouter(prefix="/partner-leads", tags=["partner-leads"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.post("", response_model=PartnerLeadResponse, status_code=201)
async def create_partner_lead(
    payload: PartnerLeadCreateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerLeadResponse:
    return await PartnerLeadService(session).create_lead(current_user, payload)


@router.get("", response_model=PartnerLeadListResponse)
async def list_partner_leads(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(default=None),
    source: str | None = Query(default=None),
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PARTNER_LEAD_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PARTNER_LEAD_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerLeadListResponse:
    _ = current_user
    return await PartnerLeadService(session).list_leads(
        status=status,
        source=source,
        city=city,
        page=page,
        page_size=page_size,
    )


@router.post("/import-preview", response_model=PartnerLeadImportPreviewResponse)
async def partner_leads_import_preview(
    payload: PartnerLeadImportPreviewRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerLeadImportPreviewResponse:
    _ = current_user
    return await PartnerLeadService(session).import_preview(payload)


@router.get("/{lead_id}", response_model=PartnerLeadResponse)
async def get_partner_lead(
    lead_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerLeadResponse:
    _ = current_user
    return await PartnerLeadService(session).get_lead(lead_id)


@router.patch("/{lead_id}", response_model=PartnerLeadResponse)
async def update_partner_lead(
    lead_id: uuid.UUID,
    payload: PartnerLeadUpdateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerLeadResponse:
    return await PartnerLeadService(session).update_lead(current_user, lead_id, payload)


@router.post("/{lead_id}/convert", response_model=PartnerLeadResponse)
async def convert_partner_lead(
    lead_id: uuid.UUID,
    payload: PartnerLeadConvertRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerLeadResponse:
    return await PartnerLeadService(session).convert_lead(current_user, lead_id, payload)
