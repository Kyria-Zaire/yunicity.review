"""User profile business logic."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
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
from app.models.user_profile import ProfileVisibility, UserProfile, UserProfileUsernameHistory
from app.repositories.passport_repository import PassportRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import (
    ProfileCompleteRequest,
    ProfileMeResponse,
    ProfilePublicResponse,
    ProfileUpdateRequest,
    UsernameAvailabilityResponse,
    UsernameChangeRequest,
    validate_interests,
)

USERNAME_CHANGE_INTERVAL = timedelta(days=14)


def username_next_change_at(changed_at: datetime) -> datetime:
    if changed_at.tzinfo is None:
        changed_at = changed_at.replace(tzinfo=UTC)
    return changed_at + USERNAME_CHANGE_INTERVAL


class ProfileService:
    USERNAME_CHANGE_INTERVAL = USERNAME_CHANGE_INTERVAL

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._profiles = ProfileRepository(session)

    async def get_me(self, user: User) -> ProfileMeResponse:
        profile = await self._get_profile_for_user(user.id)
        return await self._build_me_response(user.id, profile)

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
        return await self._build_me_response(user.id, profile)

    async def username_availability(
        self, user: User, username: str
    ) -> UsernameAvailabilityResponse:
        normalized = normalize_username(username)
        profile = await self._get_profile_for_user(user.id)
        unchanged = normalized == profile.username
        if unchanged:
            return UsernameAvailabilityResponse(username=normalized, available=True, unchanged=True)
        available = is_valid_username_format(
            normalized
        ) and not await self._profiles.username_exists(normalized)
        return UsernameAvailabilityResponse(username=normalized, available=available)

    async def change_username(
        self, user: User, payload: UsernameChangeRequest
    ) -> ProfileMeResponse:
        normalized = normalize_username(payload.username)
        self.validate_username_assignment(normalized)
        profile = await self._profiles.get_by_user_id_for_update(user.id)
        if profile is None:
            raise AppError(404, "PROFILE_NOT_FOUND", "Profil introuvable.")
        if normalized == profile.username:
            return await self._build_me_response(user.id, profile)

        now = datetime.now(UTC)
        if profile.username_changed_at is not None:
            next_change_at = username_next_change_at(profile.username_changed_at)
            if now < next_change_at:
                raise AppError(
                    429,
                    "USERNAME_CHANGE_TOO_RECENT",
                    "Vous pourrez modifier votre nom d'utilisateur à partir du "
                    f"{next_change_at.isoformat()}.",
                    metadata={"next_change_at": next_change_at.isoformat()},
                )
        if await self._profiles.username_exists(normalized):
            raise AppError(409, "USERNAME_TAKEN", "Ce nom d'utilisateur n'est pas disponible.")

        self._session.add(
            UserProfileUsernameHistory(username=profile.username, user_id=user.id, retired_at=now)
        )
        profile.username = normalized
        profile.username_changed_at = now
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                409, "USERNAME_TAKEN", "Ce nom d'utilisateur n'est pas disponible."
            ) from exc
        await self._session.refresh(profile)
        return await self._build_me_response(user.id, profile)

    async def set_avatar_url(self, user: User, url: str) -> ProfileMeResponse:
        return await self._set_media_url(user, field="avatar_url", url=url)

    async def set_banner_url(self, user: User, url: str) -> ProfileMeResponse:
        return await self._set_media_url(user, field="banner_url", url=url)

    async def _set_media_url(self, user: User, *, field: str, url: str) -> ProfileMeResponse:
        profile = await self._get_profile_for_user(user.id)
        await self._profiles.update_fields(profile, fields={field: url})
        await self._session.commit()
        await self._session.refresh(profile)
        return await self._build_me_response(user.id, profile)

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
        return await self._build_me_response(user.id, profile)

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

    async def get_public_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        viewer: User | None = None,
    ) -> ProfilePublicResponse:
        # Voie ALTERNATIVE vers le meme profil : sans ce filtre, masquer la
        # resolution par pseudonyme ne servirait a rien (AUTH-02A).
        profile = await self._profiles.get_public_identity(user_id)
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

    async def _build_me_response(
        self,
        user_id: uuid.UUID,
        profile: UserProfile,
    ) -> ProfileMeResponse:
        has_active_passport = (
            await PassportRepository(self._session).get_active_for_user(user_id) is not None
        )
        next_change_at = None
        if profile.username_changed_at is not None:
            next_change_at = username_next_change_at(profile.username_changed_at)
        return ProfileMeResponse.model_validate(profile).model_copy(
            update={
                "has_active_passport": has_active_passport,
                "username_next_change_at": next_change_at,
            },
        )

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

    def can_view_profile(self, profile: UserProfile, *, viewer: User | None) -> bool:
        return self._can_view_profile(profile, viewer=viewer)

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
