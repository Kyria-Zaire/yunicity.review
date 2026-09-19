"""Profile HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import (
    get_current_user_optional,
    require_authenticated_user,
)
from app.core.profile_media_constants import ProfileMediaKind
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.feed import FeedListResponse
from app.schemas.neighborhood import NeighborhoodContributionMeListResponse
from app.schemas.profile import (
    ProfileCompleteRequest,
    ProfileMeResponse,
    ProfilePublicResponse,
    ProfileUpdateRequest,
)
from app.schemas.tribe import TribeListResponse
from app.services.profile_media_service import ProfileMediaService
from app.services.profile_public_context_service import ProfilePublicContextService
from app.services.profile_public_feed_service import ProfilePublicFeedService
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.get("/me", response_model=ProfileMeResponse)
async def get_profile_me(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileMeResponse:
    return await ProfileService(session).get_me(current_user)


@router.patch("/me", response_model=ProfileMeResponse)
async def patch_profile_me(
    payload: ProfileUpdateRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileMeResponse:
    await enforce_rate_limit(
        f"profile:patch:{current_user.id}",
        limit=30,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"profile:patch:ip:{_client_ip(request)}",
        limit=60,
        window_seconds=3600,
    )
    return await ProfileService(session).update_me(current_user, payload)


@router.post("/me/avatar", response_model=ProfileMeResponse)
async def upload_profile_avatar(
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> ProfileMeResponse:
    await enforce_rate_limit(
        f"profile:avatar:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"profile:avatar:ip:{_client_ip(request)}",
        limit=40,
        window_seconds=3600,
    )
    settings = get_settings()
    url = await ProfileMediaService(settings).upload(current_user, file, ProfileMediaKind.AVATAR)
    return await ProfileService(session).set_avatar_url(current_user, url)


@router.post("/me/banner", response_model=ProfileMeResponse)
async def upload_profile_banner(
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> ProfileMeResponse:
    await enforce_rate_limit(
        f"profile:banner:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"profile:banner:ip:{_client_ip(request)}",
        limit=40,
        window_seconds=3600,
    )
    settings = get_settings()
    url = await ProfileMediaService(settings).upload(current_user, file, ProfileMediaKind.BANNER)
    return await ProfileService(session).set_banner_url(current_user, url)


@router.post("/complete", response_model=ProfileMeResponse)
async def complete_profile_onboarding(
    payload: ProfileCompleteRequest,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileMeResponse:
    return await ProfileService(session).complete_onboarding(current_user, payload)


@router.get("/{username}/posts", response_model=FeedListResponse)
async def get_public_profile_posts(
    username: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> FeedListResponse:
    return await ProfilePublicFeedService(session).list_public_posts_by_username(
        username,
        viewer=current_user,
        limit=limit,
    )


@router.get("/{username}/contributions", response_model=NeighborhoodContributionMeListResponse)
async def get_public_profile_contributions(
    username: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> NeighborhoodContributionMeListResponse:
    return await ProfilePublicContextService(session).list_public_contributions_by_username(
        username,
        viewer=current_user,
        limit=limit,
    )


@router.get("/{username}/tribes", response_model=TribeListResponse)
async def get_public_profile_tribes(
    username: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    limit: int = Query(default=12, ge=1, le=24),
) -> TribeListResponse:
    return await ProfilePublicContextService(session).list_public_tribes_by_username(
        username,
        viewer=current_user,
        limit=limit,
    )


@router.get("/{username}", response_model=ProfilePublicResponse)
async def get_public_profile(
    username: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> ProfilePublicResponse:
    return await ProfileService(session).get_public_by_username(
        username,
        viewer=current_user,
    )
