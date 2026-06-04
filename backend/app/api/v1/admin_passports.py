"""Admin passport ops read routes — staff only (ADMIN-03A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_passport import (
    ADMIN_PASSPORT_LIST_PAGE_SIZE_DEFAULT,
    ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX,
    ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT,
    ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    AdminPassportActionListResponse,
    AdminPassportDetailResponse,
    AdminPassportListResponse,
    AdminPassportRedemptionListResponse,
    AdminPassportSearchMode,
    AdminPassportStampListResponse,
    AdminPassportStatusPatchRequest,
    AdminStaffPassportStatus,
)
from app.services.admin_passport_service import AdminPassportService

router = APIRouter(prefix="/admin/passports", tags=["admin-passports"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=AdminPassportListResponse)
async def list_admin_passports(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(
        default=None,
        max_length=128,
        description="Ville pilote (défaut : Reims)",
    ),
    status: Annotated[AdminStaffPassportStatus | None, Query()] = None,
    q: str | None = Query(default=None, max_length=320),
    search_mode: Annotated[AdminPassportSearchMode | None, Query()] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_PASSPORT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminPassportListResponse:
    _ = current_user
    return await AdminPassportService(session).list_passports(
        city=city,
        status=status,
        q=q,
        search_mode=search_mode,
        page=page,
        page_size=page_size,
    )


@router.get("/{passport_id}", response_model=AdminPassportDetailResponse)
async def get_admin_passport_detail(
    passport_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPassportDetailResponse:
    _ = current_user
    return await AdminPassportService(session).get_passport_detail(passport_id)


@router.patch("/{passport_id}", response_model=AdminPassportDetailResponse)
async def patch_admin_passport_status(
    passport_id: uuid.UUID,
    payload: AdminPassportStatusPatchRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminPassportDetailResponse:
    return await AdminPassportService(session).patch_passport_status(
        passport_id,
        current_user,
        payload,
    )


@router.get("/{passport_id}/stamps", response_model=AdminPassportStampListResponse)
async def list_admin_passport_stamps(
    passport_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    ),
) -> AdminPassportStampListResponse:
    _ = current_user
    return await AdminPassportService(session).list_stamps(
        passport_id=passport_id,
        page=page,
        page_size=page_size,
    )


@router.get("/{passport_id}/redemptions", response_model=AdminPassportRedemptionListResponse)
async def list_admin_passport_redemptions(
    passport_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    ),
) -> AdminPassportRedemptionListResponse:
    _ = current_user
    return await AdminPassportService(session).list_redemptions(
        passport_id=passport_id,
        page=page,
        page_size=page_size,
    )


@router.get("/{passport_id}/actions", response_model=AdminPassportActionListResponse)
async def list_admin_passport_actions(
    passport_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX,
    ),
) -> AdminPassportActionListResponse:
    _ = current_user
    return await AdminPassportService(session).list_actions(
        passport_id=passport_id,
        page=page,
        page_size=page_size,
    )
