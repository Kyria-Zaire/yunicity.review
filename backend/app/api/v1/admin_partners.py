"""Admin partner detail read routes — staff only (ADMIN-02D1)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_partner import AdminPartnerDetailResponse
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
