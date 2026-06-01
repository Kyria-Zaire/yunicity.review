"""Admin partner creator content moderation (WEB-PARTNERS-06C)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin_partner_creator_content import (
    PartnerCreatorContentAdminResponse,
    PartnerCreatorContentRejectRequest,
)
from app.services.partner_creator_content_service import PartnerCreatorContentService

router = APIRouter(
    prefix="/admin/partner-creator-content",
    tags=["admin-partner-creator-content"],
)

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.post("/{content_id}/approve", response_model=PartnerCreatorContentAdminResponse)
async def approve_partner_creator_content(
    content_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentAdminResponse:
    return await PartnerCreatorContentService(session).approve_content(current_user, content_id)


@router.post("/{content_id}/reject", response_model=PartnerCreatorContentAdminResponse)
async def reject_partner_creator_content(
    content_id: uuid.UUID,
    payload: PartnerCreatorContentRejectRequest,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentAdminResponse:
    return await PartnerCreatorContentService(session).reject_content(
        current_user,
        content_id,
        payload,
    )


@router.post("/{content_id}/archive", response_model=PartnerCreatorContentAdminResponse)
async def archive_partner_creator_content(
    content_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentAdminResponse:
    return await PartnerCreatorContentService(session).archive_content(current_user, content_id)
