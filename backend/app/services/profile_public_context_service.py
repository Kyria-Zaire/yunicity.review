"""Public profile contributions and tribes (citizen showcase surfaces)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.profile_username import is_valid_username_format, normalize_username
from app.models.user import User
from app.models.user_profile import UserProfile
from app.repositories.neighborhood_contribution_repository import NeighborhoodContributionRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.tribe_repository import TribeRepository
from app.schemas.neighborhood import (
    NeighborhoodContributionMeListResponse,
)
from app.schemas.tribe import TribeListResponse, TribeResponse
from app.services.neighborhood_contribution_presenter import to_public_item
from app.services.profile_service import ProfileService
from app.services.tribe_service import TribeService

_PUBLIC_LIST_LIMIT_DEFAULT = 12
_PUBLIC_LIST_LIMIT_MAX = 24


class ProfilePublicContextService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profiles = ProfileRepository(session)
        self._contributions = NeighborhoodContributionRepository(session)
        self._tribes = TribeRepository(session)
        self._profile_service = ProfileService(session)
        self._tribe_service = TribeService(session)

    async def list_public_contributions_by_username(
        self,
        username: str,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_LIST_LIMIT_DEFAULT,
    ) -> NeighborhoodContributionMeListResponse:
        profile = await self._require_viewable_profile_by_username(username, viewer=viewer)
        return await self._list_contributions(profile.user_id, limit=limit)

    async def list_public_contributions_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_LIST_LIMIT_DEFAULT,
    ) -> NeighborhoodContributionMeListResponse:
        await self._require_viewable_profile_by_user_id(user_id, viewer=viewer)
        return await self._list_contributions(user_id, limit=limit)

    async def list_public_tribes_by_username(
        self,
        username: str,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_LIST_LIMIT_DEFAULT,
    ) -> TribeListResponse:
        profile = await self._require_viewable_profile_by_username(username, viewer=viewer)
        return await self._list_tribes(profile.user_id, viewer=viewer, limit=limit)

    async def list_public_tribes_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
        limit: int = _PUBLIC_LIST_LIMIT_DEFAULT,
    ) -> TribeListResponse:
        await self._require_viewable_profile_by_user_id(user_id, viewer=viewer)
        return await self._list_tribes(user_id, viewer=viewer, limit=limit)

    async def _list_contributions(
        self,
        user_id: uuid.UUID,
        *,
        limit: int,
    ) -> NeighborhoodContributionMeListResponse:
        capped = max(1, min(limit, _PUBLIC_LIST_LIMIT_MAX))
        rows = await self._contributions.list_approved_by_author(user_id, limit=capped)
        return NeighborhoodContributionMeListResponse(
            items=[to_public_item(row) for row in rows],
        )

    async def _list_tribes(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
        limit: int,
    ) -> TribeListResponse:
        capped = max(1, min(limit, _PUBLIC_LIST_LIMIT_MAX))
        rows = await self._tribes.list_public_for_user(user_id, limit=capped)
        items: list[TribeResponse] = []
        for tribe in rows:
            items.append(await self._tribe_service.to_response(tribe, viewer))
        return TribeListResponse(items=items, total=len(items), page=1, page_size=capped)

    async def _require_viewable_profile_by_username(
        self,
        username: str,
        *,
        viewer: User | None,
    ) -> UserProfile:
        normalized = normalize_username(username)
        if not is_valid_username_format(normalized):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        profile = await self._profiles.get_by_username(normalized)
        if profile is None or not self._profile_service.can_view_profile(profile, viewer=viewer):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        return profile

    async def _require_viewable_profile_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None,
    ) -> UserProfile:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is None or not self._profile_service.can_view_profile(profile, viewer=viewer):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        return profile
