"""Authentication business logic."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    hash_refresh_token,
    normalize_email,
    validate_password_strength,
    verify_password,
)
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RefreshTokenResponse, RegisterRequest
from app.schemas.user import UserPublic
from app.services.profile_service import ProfileService

_INVALID_CREDENTIALS_MSG = "Identifiants invalides."


@dataclass(frozen=True)
class IssuedRefreshToken:
    raw_token: str
    max_age_seconds: int


@dataclass(frozen=True)
class AuthSessionBundle:
    access_token: str
    expires_in: int
    refresh: IssuedRefreshToken
    user: UserPublic


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._rbac = RbacRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)

    async def register(self, payload: RegisterRequest) -> AuthSessionBundle:
        email = normalize_email(str(payload.email))
        validate_password_strength(payload.password)

        if await self._users.get_by_email(email) is not None:
            raise AppError(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                detail="Un compte existe déjà avec cet email.",
            )

        hashed = hash_password(payload.password)
        try:
            user = await self._users.create(
                email=email,
                hashed_password=hashed,
                full_name=payload.full_name,
                city=payload.city,
            )
            await self._rbac.assign_role_to_user(user.id, "USER")
            await ProfileService(self._session).create_profile_for_new_user(
                user_id=user.id,
                email=email,
                full_name=payload.full_name,
                city=payload.city,
            )
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                detail="Un compte existe déjà avec cet email.",
            ) from exc

        await self._session.refresh(user)
        return await self._issue_session(user, new_family=True)

    async def login(self, payload: LoginRequest) -> AuthSessionBundle:
        email = normalize_email(str(payload.email))
        user = await self._users.get_by_email(email)
        if user is None:
            raise AppError(
                status_code=401,
                code="INVALID_CREDENTIALS",
                detail=_INVALID_CREDENTIALS_MSG,
            )
        if not verify_password(payload.password, user.hashed_password):
            raise AppError(
                status_code=401,
                code="INVALID_CREDENTIALS",
                detail=_INVALID_CREDENTIALS_MSG,
            )
        self._ensure_active(user)
        return await self._issue_session(user, new_family=True)

    async def refresh(
        self, raw_refresh_token: str
    ) -> tuple[RefreshTokenResponse, IssuedRefreshToken | None]:
        token_hash = hash_refresh_token(raw_refresh_token, self._settings.refresh_token_pepper)
        stored = await self._refresh_tokens.get_by_hash(token_hash)
        if stored is None:
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expirée.",
            )

        if stored.replaced_by_token_id is not None or stored.revoked_at is not None:
            await self._refresh_tokens.revoke_family(stored.family_id)
            await self._session.commit()
            raise AppError(
                status_code=401,
                code="REFRESH_TOKEN_REUSE",
                detail="Session invalide ou expirée.",
            )

        now = datetime.now(UTC)
        if stored.expires_at <= now:
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expirée.",
            )

        user = await self._users.get_by_id(stored.user_id)
        if user is None:
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expirée.",
            )
        self._ensure_active(user)

        new_raw = generate_opaque_token()
        new_hash = hash_refresh_token(new_raw, self._settings.refresh_token_pepper)
        expires_at = now + timedelta(days=self._settings.refresh_token_expire_days)
        new_stored = await self._refresh_tokens.create(
            user_id=user.id,
            token_hash=new_hash,
            family_id=stored.family_id,
            expires_at=expires_at,
        )
        await self._refresh_tokens.mark_rotated(stored, new_stored.id)
        await self._session.commit()

        access = create_access_token(user.id, self._settings)
        max_age = int((expires_at - now).total_seconds())
        response = RefreshTokenResponse(
            access_token=access,
            expires_in=self._settings.access_token_ttl_seconds,
        )
        return response, IssuedRefreshToken(raw_token=new_raw, max_age_seconds=max_age)

    async def logout(self, raw_refresh_token: str | None) -> None:
        if not raw_refresh_token:
            return
        token_hash = hash_refresh_token(raw_refresh_token, self._settings.refresh_token_pepper)
        stored = await self._refresh_tokens.get_by_hash(token_hash)
        if stored is not None:
            await self._refresh_tokens.revoke(stored)
            await self._session.commit()

    async def get_me(self, user_id: uuid.UUID) -> UserPublic:
        user = await self._users.get_by_id(user_id)
        if user is None:
            raise AppError(
                status_code=401,
                code="UNAUTHORIZED",
                detail="Utilisateur introuvable.",
            )
        self._ensure_active(user)
        return await self._build_user_public(user)

    async def _issue_session(self, user: User, *, new_family: bool) -> AuthSessionBundle:
        raw_refresh = generate_opaque_token()
        token_hash = hash_refresh_token(raw_refresh, self._settings.refresh_token_pepper)
        family_id = uuid.uuid4() if new_family else uuid.uuid4()
        expires_at = datetime.now(UTC) + timedelta(days=self._settings.refresh_token_expire_days)
        await self._refresh_tokens.create(
            user_id=user.id,
            token_hash=token_hash,
            family_id=family_id,
            expires_at=expires_at,
        )
        await self._session.commit()

        access = create_access_token(user.id, self._settings)
        max_age = int((expires_at - datetime.now(UTC)).total_seconds())
        user_public = await self._build_user_public(user)
        return AuthSessionBundle(
            access_token=access,
            expires_in=self._settings.access_token_ttl_seconds,
            refresh=IssuedRefreshToken(raw_token=raw_refresh, max_age_seconds=max_age),
            user=user_public,
        )

    async def _build_user_public(self, user: User) -> UserPublic:
        roles = await self._rbac.get_role_keys_for_user(user.id)
        permissions = await self._rbac.get_permission_keys_for_user(user.id)
        return UserPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            city=user.city,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=roles,
            permissions=permissions,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def _ensure_active(self, user: User) -> None:
        if not user.is_active:
            raise AppError(
                status_code=403,
                code="ACCOUNT_SUSPENDED",
                detail="Ce compte est suspendu.",
            )
