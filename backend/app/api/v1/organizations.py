"""Organization HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user_optional,
    require_any_permission,
    require_authenticated_user,
)
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationCreateResponse,
    OrganizationMeListResponse,
    OrganizationMembersListResponse,
    OrganizationMemberViewResponse,
    OrganizationPublicResponse,
    OrganizationReviewRequest,
    OrganizationUpdateRequest,
)
from app.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/request", response_model=OrganizationCreateResponse, status_code=201)
async def create_organization_request(
    payload: OrganizationCreateRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrganizationCreateResponse:
    await enforce_rate_limit(
        f"org:request:{current_user.id}",
        limit=10,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"org:request:ip:{_client_ip(request)}",
        limit=20,
        window_seconds=3600,
    )
    return await OrganizationService(session).create_request(current_user, payload)


@router.get("/me", response_model=OrganizationMeListResponse)
async def list_my_organizations(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrganizationMeListResponse:
    return await OrganizationService(session).list_my_organizations(current_user)


@router.get(
    "/{organization_id}/members",
    response_model=OrganizationMembersListResponse,
)
async def list_organization_members(
    organization_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrganizationMembersListResponse:
    return await OrganizationService(session).list_members(organization_id, current_user)


@router.patch(
    "/{organization_id}",
    response_model=OrganizationMemberViewResponse,
)
async def patch_organization(
    organization_id: uuid.UUID,
    payload: OrganizationUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrganizationMemberViewResponse:
    return await OrganizationService(session).update_organization(
        organization_id,
        current_user,
        payload,
    )


@router.post(
    "/{organization_id}/review",
    response_model=OrganizationMemberViewResponse,
)
async def review_organization(
    organization_id: uuid.UUID,
    payload: OrganizationReviewRequest,
    current_user: Annotated[
        User,
        Depends(require_any_permission("moderation.manage", "system.admin")),
    ],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> OrganizationMemberViewResponse:
    return await OrganizationService(session).review_organization(
        organization_id,
        current_user,
        payload,
    )


@router.get("/{slug}", response_model=OrganizationPublicResponse | OrganizationMemberViewResponse)
async def get_organization_by_slug(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> OrganizationPublicResponse | OrganizationMemberViewResponse:
    return await OrganizationService(session).get_by_slug(slug, viewer=current_user)
