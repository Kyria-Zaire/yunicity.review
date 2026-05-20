"""Tribe routes (TICKET-A.2)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_optional, require_authenticated_user
from app.core.tribe_constants import TRIBE_LIST_PAGE_SIZE_DEFAULT, TRIBE_LIST_PAGE_SIZE_MAX
from app.db.session import get_db
from app.models.user import User
from app.schemas.post import PostResponse
from app.schemas.tribe import (
    TribeInvitationCreateResponse,
    TribeJoinRequest,
    TribeListResponse,
    TribeMemberListResponse,
    TribeMemberResponse,
    TribeMemberRoleUpdateRequest,
    TribePostCreateRequest,
    TribePostListResponse,
    TribeResponse,
    TribeUpdateRequest,
)
from app.services.tribe_post_service import TribePostService
from app.services.tribe_service import TribeService

router = APIRouter(prefix="/tribes", tags=["tribes"])


@router.get("", response_model=TribeListResponse)
async def list_tribes(
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
    featured_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=TRIBE_LIST_PAGE_SIZE_DEFAULT, ge=1, le=TRIBE_LIST_PAGE_SIZE_MAX),
    viewer: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> TribeListResponse:
    return await TribeService(session).list_public(
        city=city,
        featured_only=featured_only,
        page=page,
        page_size=page_size,
        viewer=viewer,
    )


@router.get("/{slug}", response_model=TribeResponse)
async def get_tribe(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
    viewer: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> TribeResponse:
    return await TribeService(session).get_by_slug(city=city, slug=slug, viewer=viewer)


@router.patch("/{slug}", response_model=TribeResponse)
async def update_tribe(
    slug: str,
    payload: TribeUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> TribeResponse:
    return await TribeService(session).update(current_user, city=city, slug=slug, payload=payload)


@router.post("/{slug}/join", response_model=TribeMemberResponse)
async def join_tribe(
    slug: str,
    payload: TribeJoinRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> TribeMemberResponse:
    return await TribeService(session).join(
        current_user, city=city, slug=slug, charter_accepted=payload.charter_accepted
    )


@router.post("/{slug}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_tribe(
    slug: str,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> None:
    await TribeService(session).leave(current_user, city=city, slug=slug)


@router.get("/{slug}/posts", response_model=TribePostListResponse)
async def list_tribe_posts(
    slug: str,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
    cursor: str | None = None,
    limit: int = Query(default=20, ge=1, le=30),
) -> TribePostListResponse:
    return await TribePostService(session).list_posts(
        current_user, city=city, slug=slug, cursor=cursor, limit=limit
    )


@router.post("/{slug}/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_tribe_post(
    slug: str,
    payload: TribePostCreateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> PostResponse:
    return await TribePostService(session).create_post(
        current_user, city=city, slug=slug, payload=payload
    )


@router.delete("/{slug}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tribe_post(
    slug: str,
    post_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> None:
    await TribePostService(session).soft_delete_post(
        current_user, city=city, slug=slug, post_id=post_id
    )


@router.get("/{slug}/members", response_model=TribeMemberListResponse)
async def list_tribe_members(
    slug: str,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> TribeMemberListResponse:
    return await TribeService(session).list_members(
        current_user, city=city, slug=slug, page=page, page_size=page_size
    )


@router.patch("/{slug}/members/{user_id}", response_model=TribeMemberResponse)
async def update_tribe_member(
    slug: str,
    user_id: uuid.UUID,
    payload: TribeMemberRoleUpdateRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> TribeMemberResponse:
    return await TribeService(session).update_member_role(
        current_user,
        city=city,
        slug=slug,
        target_user_id=user_id,
        payload=payload,
    )


@router.delete("/{slug}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tribe_member(
    slug: str,
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> None:
    await TribeService(session).remove_member(
        current_user, city=city, slug=slug, target_user_id=user_id
    )


@router.post("/{slug}/invite", response_model=TribeInvitationCreateResponse)
async def invite_to_tribe(
    slug: str,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(min_length=1),
) -> TribeInvitationCreateResponse:
    return await TribeService(session).create_invitation(current_user, city=city, slug=slug)
