"""Admin partner detail and staff actions — staff only (ADMIN-02D1 / 02D3A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_partner import (
    AdminPartnerActivateRequest,
    AdminPartnerCreateProfileRequest,
    AdminPartnerDetailResponse,
    AdminPartnerPatchRequest,
    AdminPartnerPauseRequest,
    AdminPartnerUpgradePremiumRequest,
)
from app.services.admin_partner_service import AdminPartnerService

router = APIRouter(prefix="/admin/partners", tags=["admin-partners"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("/{organization_id}", response_model=AdminPartnerDetailResponse)
async def get_admin_partner_detail(
    organization_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    _ = current_user
    return await AdminPartnerService(session).get_partner_detail(organization_id)


@router.post("/{organization_id}/profile", response_model=AdminPartnerDetailResponse)
async def create_admin_partner_profile(
    organization_id: uuid.UUID,
    payload: AdminPartnerCreateProfileRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    return await AdminPartnerService(session).create_profile(
        organization_id,
        current_user,
        payload,
    )


@router.post("/{organization_id}/activate", response_model=AdminPartnerDetailResponse)
async def activate_admin_partner(
    organization_id: uuid.UUID,
    payload: AdminPartnerActivateRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    return await AdminPartnerService(session).activate(
        organization_id,
        current_user,
        payload,
    )


@router.post("/{organization_id}/pause", response_model=AdminPartnerDetailResponse)
async def pause_admin_partner(
    organization_id: uuid.UUID,
    payload: AdminPartnerPauseRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    return await AdminPartnerService(session).pause(organization_id, current_user, payload)


@router.post(
    "/{organization_id}/upgrade-premium",
    response_model=AdminPartnerDetailResponse,
)
async def upgrade_admin_partner_premium(
    organization_id: uuid.UUID,
    payload: AdminPartnerUpgradePremiumRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    return await AdminPartnerService(session).upgrade_premium(
        organization_id,
        current_user,
        payload,
    )


@router.patch("/{organization_id}", response_model=AdminPartnerDetailResponse)
async def patch_admin_partner_settings(
    organization_id: uuid.UUID,
    payload: AdminPartnerPatchRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPartnerDetailResponse:
    return await AdminPartnerService(session).patch_settings(
        organization_id,
        current_user,
        payload,
    )
