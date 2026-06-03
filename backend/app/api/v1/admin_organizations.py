"""Admin organization verification queue — staff only (ADMIN-02B1)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.organization_constants import VerificationStatus
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_organization import (
    ADMIN_ORGANIZATION_LIST_PAGE_SIZE_DEFAULT,
    ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX,
    AdminOrganizationListResponse,
)
from app.services.admin_organization_service import AdminOrganizationService

router = APIRouter(prefix="/admin/organizations", tags=["admin-organizations"])

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=AdminOrganizationListResponse)
async def list_organizations_admin(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(
        default=None,
        max_length=128,
        description="Ville pilote (défaut : Reims)",
    ),
    verification_status: Annotated[VerificationStatus | None, Query()] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=ADMIN_ORGANIZATION_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminOrganizationListResponse:
    _ = current_user
    return await AdminOrganizationService(session).list_organizations(
        city=city,
        verification_status=verification_status,
        page=page,
        page_size=page_size,
    )
