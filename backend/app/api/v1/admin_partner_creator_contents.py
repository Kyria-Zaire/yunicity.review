"""Admin partner creator content moderation (WEB-PARTNERS-06C / ADMIN-CREATOR-01)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_any_permission
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.core.creator_content_admin_constants import (
    CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
    CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
)
from app.schemas.admin_partner_creator_content import (
    AdminPartnerCreatorContentActionListResponse,
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    PartnerCreatorContentAdminListResponse,
    PartnerCreatorContentAdminResponse,
    PartnerCreatorContentRejectRequest,
)
from app.schemas.partner_creator_content_management import parse_creator_content_status_filter
from app.services.admin_partner_creator_content_service import AdminPartnerCreatorContentService
from app.services.partner_creator_content_service import PartnerCreatorContentService

router = APIRouter(
    prefix="/admin/partner-creator-content",
    tags=["admin-partner-creator-content"],
)

_staff_guard = require_any_permission("moderation.manage", "system.admin")


@router.get("", response_model=PartnerCreatorContentAdminListResponse)
async def list_partner_creator_contents_admin(
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(
        default=None,
        description="draft | pending_review | published | rejected | archived",
    ),
    sort: str = Query(default="newest", description="newest | oldest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerCreatorContentAdminListResponse:
    _ = current_user
    parsed_status: str | None = None
    if status is not None and status.strip():
        try:
            parsed_status = parse_creator_content_status_filter(status)
        except ValueError as exc:
            raise AppError(
                status_code=422,
                code="CREATOR_CONTENT_STATUS_INVALID",
                detail=str(exc),
            ) from exc
    sort_newest = sort.strip().lower() != "oldest"
    return await PartnerCreatorContentService(session).list_contents_admin(
        status=parsed_status,
        page=page,
        page_size=page_size,
        sort_newest=sort_newest,
    )


@router.get("/{content_id}", response_model=PartnerCreatorContentAdminResponse)
async def get_partner_creator_content_admin(
    content_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentAdminResponse:
    _ = current_user
    return await PartnerCreatorContentService(session).get_content_admin(content_id)


@router.get(
    "/{content_id}/actions",
    response_model=AdminPartnerCreatorContentActionListResponse,
)
async def list_partner_creator_content_actions_admin(
    content_id: uuid.UUID,
    current_user: Annotated[User, Depends(_staff_guard)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=CREATOR_CONTENT_ADMIN_ACTION_LIST_PAGE_SIZE_MAX,
    ),
) -> AdminPartnerCreatorContentActionListResponse:
    _ = current_user
    return await AdminPartnerCreatorContentService(session).list_content_actions(
        content_id=content_id,
        page=page,
        page_size=page_size,
    )


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
