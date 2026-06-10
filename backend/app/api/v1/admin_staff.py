"""Admin staff management API (ADMIN-08B)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_permission
from app.core.staff_admin_constants import (
    STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
    STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    STAFF_ADMIN_LIST_PAGE_SIZE_DEFAULT,
    STAFF_ADMIN_LIST_PAGE_SIZE_MAX,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_staff import (
    AdminStaffActionListResponse,
    AdminStaffAdminSummaryResponse,
    AdminStaffAssignRoleRequest,
    AdminStaffDetailResponse,
    AdminStaffListResponse,
    AdminStaffReasonRequest,
)
from app.services.admin_staff_service import AdminStaffService

router = APIRouter(prefix="/admin/staff", tags=["admin-staff"])

_system_admin_guard = require_permission("system.admin")


@router.get("", response_model=AdminStaffListResponse)
async def list_staff_admin(
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=STAFF_ADMIN_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=STAFF_ADMIN_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminStaffListResponse:
    _ = current_user
    return await AdminStaffService(session).list_staff(
        role=role,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=AdminStaffAdminSummaryResponse)
async def get_staff_admin_summary(
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffAdminSummaryResponse:
    _ = current_user
    return await AdminStaffService(session).get_staff_admin_summary()


@router.get("/{user_id}", response_model=AdminStaffDetailResponse)
async def get_staff_admin(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffDetailResponse:
    _ = current_user
    return await AdminStaffService(session).get_staff_detail(user_id)


@router.post("/{user_id}/roles", response_model=AdminStaffDetailResponse)
async def assign_staff_role_admin(
    user_id: uuid.UUID,
    payload: AdminStaffAssignRoleRequest,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffDetailResponse:
    return await AdminStaffService(session).assign_role(
        current_user,
        user_id,
        role_key=payload.role,
        reason=payload.reason,
    )


@router.delete("/{user_id}/roles/{role}", response_model=AdminStaffDetailResponse)
async def revoke_staff_role_admin(
    user_id: uuid.UUID,
    role: str,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffDetailResponse:
    return await AdminStaffService(session).revoke_role(
        current_user,
        user_id,
        role_key=role,
    )


@router.post("/{user_id}/suspend", response_model=AdminStaffDetailResponse)
async def suspend_staff_admin(
    user_id: uuid.UUID,
    payload: AdminStaffReasonRequest,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffDetailResponse:
    return await AdminStaffService(session).suspend_user(
        current_user,
        user_id,
        reason=payload.reason,
    )


@router.post("/{user_id}/reactivate", response_model=AdminStaffDetailResponse)
async def reactivate_staff_admin(
    user_id: uuid.UUID,
    payload: AdminStaffReasonRequest,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminStaffDetailResponse:
    return await AdminStaffService(session).reactivate_user(
        current_user,
        user_id,
        reason=payload.reason,
    )


@router.get("/{user_id}/actions", response_model=AdminStaffActionListResponse)
async def list_staff_actions_admin(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(_system_admin_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=STAFF_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminStaffActionListResponse:
    _ = current_user
    return await AdminStaffService(session).list_staff_actions(
        user_id,
        page=page,
        page_size=page_size,
    )
