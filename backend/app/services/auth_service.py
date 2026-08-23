"""Authentication business logic."""

from __future__ import annotations

import logging
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
from app.repositories.passport_repository import PassportRepository
from app.repositories.rbac_repository import RbacRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RefreshTokenResponse, RegisterRequest
from app.schemas.passport import PassportActivateRequest
from app.schemas.user import UserPublic
from app.services.passport_service import PassportService
from app.services.profile_service import ProfileService
from app.services.refresh_rotation_grace import RefreshRotationGrace

logger = logging.getLogger(__name__)

_DEFAULT_REGISTER_CITY = "Reims"

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
        self._rotation_grace = RefreshRotationGrace(self._settings)

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
        city = (payload.city or "").strip() or _DEFAULT_REGISTER_CITY
        try:
            user = await self._users.create(
                email=email,
                hashed_password=hashed,
                full_name=payload.full_name,
                city=city,
            )
            try:
                await self._rbac.assign_role_to_user(user.id, "USER")
            except ValueError as exc:
                # Roles are seeded by migration 20260718_0055. A missing one means the
                # database was built or restored without that seed, which would otherwise
                # surface as an opaque 500 on every registration.
                await self._session.rollback()
                logger.error(
                    "rbac_seed_missing role=USER detail=%s — run `alembic upgrade head` "
                    "(or `python -m app.db.seeds`) to restore RBAC roles",
                    exc,
                )
                raise AppError(
                    status_code=503,
                    code="RBAC_SEED_MISSING",
                    detail="Configuration du serveur incomplète. Réessayez plus tard.",
                ) from exc
            await ProfileService(self._session).create_profile_for_new_user(
                user_id=user.id,
                email=email,
                full_name=payload.full_name,
                city=city,
            )
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                detail="Un compte existe déjà avec cet email.",
            ) from exc

        # Passport activation is best-effort: the account is already committed,
        # so a failure here (e.g. tiers not seeded) must not fail registration.
        # It is retried on the user's next login via _ensure_passport_active.
        await self._try_activate_passport(user, city)

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
        await self._ensure_passport_active(user)
        return await self._issue_session(user, new_family=True)

    async def refresh(
        self, raw_refresh_token: str
    ) -> tuple[RefreshTokenResponse, IssuedRefreshToken | None]:
        token_hash = hash_refresh_token(raw_refresh_token, self._settings.refresh_token_pepper)

        # Une reponse de rotation perdue en route (navigation qui annule la
        # requete, onglet ferme, reseau mobile) laissait le client rejouer un
        # token deja consomme, donc deconnecte. Un rejeu recent rend desormais
        # le successeur DEJA emis - voir `refresh_rotation_grace`.
        replayed = await self._rotation_grace.claim_rotation(token_hash)
        if replayed is not None:
            return await self._replay_rotation(token_hash, replayed)

        try:
            return await self._rotate_session(token_hash)
        except Exception:
            # Une rotation qui n'aboutit pas libere la prise : un client
            # legitime doit pouvoir retenter immediatement.
            await self._rotation_grace.discard(token_hash)
            raise

    async def _rotate_session(
        self, token_hash: str
    ) -> tuple[RefreshTokenResponse, IssuedRefreshToken | None]:
        stored = await self._refresh_tokens.get_by_hash(token_hash)
        if stored is None:
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expirée.",
            )

        if stored.replaced_by_token_id is not None or stored.revoked_at is not None:
            await self._rotation_grace.discard(token_hash)
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
        await self._rotation_grace.publish_successor(token_hash, new_raw)

        access = create_access_token(user.id, self._settings)
        max_age = int((expires_at - now).total_seconds())
        response = RefreshTokenResponse(
            access_token=access,
            expires_in=self._settings.access_token_ttl_seconds,
        )
        return response, IssuedRefreshToken(raw_token=new_raw, max_age_seconds=max_age)

    async def _replay_rotation(
        self, token_hash: str, successor_raw: str
    ) -> tuple[RefreshTokenResponse, IssuedRefreshToken | None]:
        """Rejoue une rotation recente : meme successeur, aucun nouvel etat.

        Aucune ecriture ici. Le successeur est relu en base et refuse s'il a ete
        revoque ou s'il a expire : un logout, un changement de mot de passe ou
        une revocation globale neutralisent donc la fenetre immediatement, sans
        attendre l'expiration de la donnee temporaire.
        """
        successor_hash = hash_refresh_token(successor_raw, self._settings.refresh_token_pepper)
        successor = await self._refresh_tokens.get_by_hash(successor_hash)
        now = datetime.now(UTC)
        if successor is None or successor.revoked_at is not None or successor.expires_at <= now:
            await self._rotation_grace.discard(token_hash)
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expiree.",
            )

        user = await self._users.get_by_id(successor.user_id)
        if user is None:
            raise AppError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                detail="Session invalide ou expiree.",
            )
        self._ensure_active(user)

        # Le jeton d'acces est reemis (le client n'a jamais recu le precedent),
        # mais l'expiration ABSOLUE du refresh reste celle de la rotation initiale.
        access = create_access_token(user.id, self._settings)
        max_age = int((successor.expires_at - now).total_seconds())
        response = RefreshTokenResponse(
            access_token=access,
            expires_in=self._settings.access_token_ttl_seconds,
        )
        return response, IssuedRefreshToken(raw_token=successor_raw, max_age_seconds=max_age)

    async def logout(self, raw_refresh_token: str | None) -> None:
        if not raw_refresh_token:
            return
        token_hash = hash_refresh_token(raw_refresh_token, self._settings.refresh_token_pepper)
        await self._rotation_grace.discard(token_hash)
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

    async def _ensure_passport_active(self, user: User) -> None:
        """Retry Passport activation for users who registered while it failed.

        No-op when the user already has an active Passport (avoids a useless
        retry). Never blocks login: a failed re-activation is logged, not raised.
        """
        existing = await PassportRepository(self._session).get_active_for_user(user.id)
        if existing is not None:
            return
        await self._try_activate_passport(user, user.city)

    async def _try_activate_passport(self, user: User, city: str | None) -> None:
        """Best-effort Passport activation. Never blocks auth flows.

        Activation is idempotent. A failure (e.g. tiers not seeded) is logged
        for monitoring and retried on the user's next login.
        """
        user_id = user.id
        try:
            payload = PassportActivateRequest(city=city) if city else None
            await PassportService(self._session).activate(user, payload)
        except Exception:
            # Deliberate broad catch: passport activation is a non-critical
            # side effect of auth and must never break registration or login.
            await self._session.rollback()
            logger.exception(
                "Passport activation failed for user %s; will retry on next login",
                user_id,
            )
            # rollback() expired the ORM instance; reload it so callers (login's
            # _issue_session) keep a live user and don't hit MissingGreenlet.
            await self._session.refresh(user)
