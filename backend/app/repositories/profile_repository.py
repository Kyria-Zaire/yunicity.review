"""User profile persistence."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.profile_username import pick_available_username
from app.models.user_profile import ProfileVisibility, UserProfile


class ProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def username_exists(self, username: str) -> bool:
        result = await self._session.execute(
            select(UserProfile.id).where(UserProfile.username == username).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_by_user_id(self, user_id: uuid.UUID) -> UserProfile | None:
        result = await self._session.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user_ids(self, user_ids: list[uuid.UUID]) -> list[UserProfile]:
        if not user_ids:
            return []
        result = await self._session.execute(
            select(UserProfile).where(UserProfile.user_id.in_(user_ids))
        )
        return list(result.scalars().all())

    async def get_by_username(self, username: str) -> UserProfile | None:
        result = await self._session.execute(
            select(UserProfile).where(UserProfile.username == username)
        )
        return result.scalar_one_or_none()

    async def create_for_user(
        self,
        *,
        user_id: uuid.UUID,
        email: str,
        full_name: str,
        city: str | None,
        display_name: str | None = None,
    ) -> UserProfile:
        username = await pick_available_username(
            self.username_exists,
            full_name=full_name,
            email=email,
            user_id=user_id,
        )
        profile = UserProfile(
            user_id=user_id,
            username=username,
            display_name=(display_name or full_name).strip() or None,
            city=city.strip() if city else None,
            interests=[],
            visibility=ProfileVisibility.PUBLIC,
            onboarding_completed=False,
            onboarding_step="city",
            preferred_language="fr",
            notification_preferences={
                "social": True,
                "passport": True,
                "offers": True,
            },
        )
        self._session.add(profile)
        await self._session.flush()
        return profile

    async def update_fields(
        self,
        profile: UserProfile,
        *,
        fields: dict[str, Any],
    ) -> UserProfile:
        for key, value in fields.items():
            setattr(profile, key, value)
        await self._session.flush()
        return profile
