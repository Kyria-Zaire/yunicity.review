"""User profile business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.profile_constants import (
    ALLOWED_INTERESTS,
    BIO_MAX_LENGTH,
    INTERESTS_MAX_COUNT,
    ONBOARDING_STEP_DONE,
)
from app.core.profile_username import (
    is_reserved_username,
    is_valid_username_format,
    normalize_username,
)
from app.models.user import User
from app.models.user_profile import ProfileVisibility, UserProfile
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import (
    ProfileCompleteRequest,
    ProfileMeResponse,
    ProfilePublicResponse,
    ProfileUpdateRequest,
    validate_interests,
)


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profiles = ProfileRepository(session)

    async def get_me(self, user: User) -> ProfileMeResponse:
        profile = await self._get_profile_for_user(user.id)
        return ProfileMeResponse.model_validate(profile)

    async def update_me(self, user: User, payload: ProfileUpdateRequest) -> ProfileMeResponse:
        profile = await self._get_profile_for_user(user.id)
        updates = payload.model_dump(exclude_unset=True)

        if "interests" in updates and updates["interests"] is not None:
            updates["interests"] = self._validate_interests_list(updates["interests"])

        if "bio" in updates and updates["bio"] is not None:
            bio = updates["bio"].strip()
            if len(bio) > BIO_MAX_LENGTH:
                raise AppError(
                    status_code=422,
                    code="BIO_TOO_LONG",
                    detail=f"La bio ne peut pas dépasser {BIO_MAX_LENGTH} caractères.",
                )
            updates["bio"] = bio or None

        if "display_name" in updates and updates["display_name"] is not None:
            updates["display_name"] = updates["display_name"].strip() or None

        if "city" in updates and updates["city"] is not None:
            updates["city"] = updates["city"].strip() or None

        if "avatar_url" in updates or "banner_url" in updates:
            for url_key in ("avatar_url", "banner_url"):
                if url_key in updates and updates[url_key] is not None:
                    url = updates[url_key].strip()
                    if url and not url.startswith("https://"):
                        raise AppError(
                            status_code=422,
                            code="INVALID_URL",
                            detail="Les URLs doivent utiliser HTTPS.",
                        )
                    updates[url_key] = url or None

        await self._profiles.update_fields(profile, fields=updates)
        await self._session.commit()
        await self._session.refresh(profile)
        return ProfileMeResponse.model_validate(profile)

    async def complete_onboarding(
        self,
        user: User,
        payload: ProfileCompleteRequest,
    ) -> ProfileMeResponse:
        profile = await self._get_profile_for_user(user.id)

        city = (payload.city or profile.city or user.city or "").strip()
        if not city:
            raise AppError(
                status_code=422,
                code="ONBOARDING_INCOMPLETE",
                detail="La ville est requise pour terminer l'onboarding.",
            )

        interests_source = payload.interests if payload.interests is not None else profile.interests
        interests = self._validate_interests_list(interests_source)
        if not interests:
            raise AppError(
                status_code=422,
                code="ONBOARDING_INCOMPLETE",
                detail="Au moins un intérêt est requis pour terminer l'onboarding.",
            )

        await self._profiles.update_fields(
            profile,
            fields={
                "city": city,
                "interests": interests,
                "onboarding_completed": True,
                "onboarding_step": ONBOARDING_STEP_DONE,
            },
        )
        await self._session.commit()
        await self._session.refresh(profile)
        return ProfileMeResponse.model_validate(profile)

    async def get_public_by_username(
        self,
        username: str,
        *,
        viewer: User | None = None,
    ) -> ProfilePublicResponse:
        normalized = normalize_username(username)
        if not is_valid_username_format(normalized):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )

        profile = await self._profiles.get_by_username(normalized)
        if profile is None:
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )

        if not self._can_view_profile(profile, viewer=viewer):
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )

        return ProfilePublicResponse(
            username=profile.username,
            display_name=profile.display_name,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            banner_url=profile.banner_url,
            city=profile.city,
            interests=list(profile.interests),
        )

    async def create_profile_for_new_user(
        self,
        *,
        user_id: uuid.UUID,
        email: str,
        full_name: str,
        city: str | None,
    ) -> UserProfile:
        return await self._profiles.create_for_user(
            user_id=user_id,
            email=email,
            full_name=full_name,
            city=city,
        )

    def validate_username_assignment(self, username: str) -> None:
        if not is_valid_username_format(username):
            if is_reserved_username(username):
                raise AppError(
                    status_code=422,
                    code="USERNAME_RESERVED",
                    detail="Ce nom d'utilisateur est réservé.",
                )
            raise AppError(
                status_code=422,
                code="INVALID_USERNAME",
                detail="Nom d'utilisateur invalide.",
            )

    async def _get_profile_for_user(self, user_id: uuid.UUID) -> UserProfile:
        profile = await self._profiles.get_by_user_id(user_id)
        if profile is None:
            raise AppError(
                status_code=404,
                code="PROFILE_NOT_FOUND",
                detail="Profil introuvable.",
            )
        return profile

    def _validate_interests_list(self, values: list[str]) -> list[str]:
        try:
            normalized = validate_interests(values)
        except ValueError as exc:
            raise AppError(
                status_code=422,
                code="INVALID_INTERESTS",
                detail=str(exc),
            ) from exc

        invalid = [tag for tag in normalized if tag not in ALLOWED_INTERESTS]
        if invalid:
            raise AppError(
                status_code=422,
                code="INVALID_INTERESTS",
                detail=f"Intérêts non autorisés : {', '.join(sorted(invalid))}.",
            )
        if len(normalized) > INTERESTS_MAX_COUNT:
            raise AppError(
                status_code=422,
                code="INVALID_INTERESTS",
                detail=f"Maximum {INTERESTS_MAX_COUNT} intérêts autorisés.",
            )
        return normalized

    def _can_view_profile(self, profile: UserProfile, *, viewer: User | None) -> bool:
        if viewer is not None and viewer.id == profile.user_id:
            return True

        if not profile.onboarding_completed:
            return False

        if profile.visibility == ProfileVisibility.PRIVATE:
            return False

        if profile.visibility == ProfileVisibility.PUBLIC:
            return True

        # city_only: authenticated viewers in the same city (uses auth user.city MVP)
        if viewer is None:
            return False
        viewer_city = (viewer.city or "").strip().lower()
        profile_city = (profile.city or "").strip().lower()
        return bool(viewer_city and profile_city and viewer_city == profile_city)
