"""Organization partner creator content self-service (WEB-PARTNERS-06A)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner_creator_content_management import (
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    PartnerCreatorContentCreateRequest,
    PartnerCreatorContentManagementListResponse,
    PartnerCreatorContentManagementResponse,
    PartnerCreatorContentUpdateRequest,
    parse_creator_content_status_filter,
)
from app.services.partner_creator_content_service import PartnerCreatorContentService

router = APIRouter(prefix="/me", tags=["organization-creator-content"])


@router.post(
    "/creator-content",
    response_model=PartnerCreatorContentManagementResponse,
    status_code=201,
)
async def create_my_organization_creator_content(
    payload: PartnerCreatorContentCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentManagementResponse:
    return await PartnerCreatorContentService(session).create_draft(current_user, payload)


@router.get("/creator-content", response_model=PartnerCreatorContentManagementListResponse)
async def list_my_organization_creator_contents(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    organization_id: str | None = Query(default=None),
    status: str | None = Query(default=None, description="content status filter"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    ),
) -> PartnerCreatorContentManagementListResponse:
    try:
        status_filter = parse_creator_content_status_filter(status)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    org_id = uuid.UUID(organization_id) if organization_id else None
    return await PartnerCreatorContentService(session).list_my_contents(
        current_user,
        organization_id=org_id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/creator-content/{content_id}",
    response_model=PartnerCreatorContentManagementResponse,
)
async def update_my_organization_creator_content(
    content_id: uuid.UUID,
    payload: PartnerCreatorContentUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentManagementResponse:
    return await PartnerCreatorContentService(session).update_draft(
        current_user,
        content_id,
        payload,
    )


@router.post(
    "/creator-content/{content_id}/submit",
    response_model=PartnerCreatorContentManagementResponse,
)
async def submit_my_organization_creator_content(
    content_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerCreatorContentManagementResponse:
    return await PartnerCreatorContentService(session).submit_for_review(
        current_user,
        content_id,
    )
