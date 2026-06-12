"""Password reset business logic (forgot / reset)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import (
    generate_opaque_token,
    hash_password,
    hash_refresh_token,
    normalize_email,
    validate_password_strength,
)
from app.integrations.resend_email import EmailDeliveryError, send_password_reset_email
from app.repositories.password_reset_token_repository import PasswordResetTokenRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository

_GENERIC_FORGOT_MESSAGE = (
    "Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
)
_INVALID_RESET_TOKEN_MSG = "Lien de réinitialisation invalide ou expiré."
_RESET_SUCCESS_MESSAGE = "Votre mot de passe a été mis à jour."


@dataclass(frozen=True)
class ForgotPasswordResult:
    message: str
    reset_url: str | None = None


class PasswordResetService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._reset_tokens = PasswordResetTokenRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)

    async def request_password_reset(self, email: str) -> ForgotPasswordResult:
        normalized = normalize_email(email)
        user = await self._users.get_by_email(normalized)
        reset_url: str | None = None

        if user is not None and user.is_active:
            raw_token = generate_opaque_token()
            token_hash = hash_refresh_token(raw_token, self._settings.refresh_token_pepper)
            expires_at = datetime.now(UTC) + timedelta(
                hours=self._settings.password_reset_expire_hours
            )
            await self._reset_tokens.invalidate_unused_for_user(user.id)
            await self._reset_tokens.create(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=expires_at,
            )
            reset_link = self._build_reset_url(raw_token)

            if self._settings.app_env == "prod":
                try:
                    await send_password_reset_email(
                        to=normalized,
                        reset_url=reset_link,
                        settings=self._settings,
                    )
                except EmailDeliveryError as exc:
                    await self._session.rollback()
                    raise AppError(
                        status_code=503,
                        code="EMAIL_DELIVERY_FAILED",
                        detail="Service temporairement indisponible. Réessayez plus tard.",
                    ) from exc

            await self._session.commit()

            if self._settings.app_env != "prod":
                reset_url = reset_link

        return ForgotPasswordResult(message=_GENERIC_FORGOT_MESSAGE, reset_url=reset_url)

    async def reset_password(self, raw_token: str, new_password: str) -> str:
        validate_password_strength(new_password)
        token_hash = hash_refresh_token(raw_token, self._settings.refresh_token_pepper)
        stored = await self._reset_tokens.get_by_hash(token_hash)
        if stored is None or stored.used_at is not None:
            raise AppError(
                status_code=400,
                code="INVALID_RESET_TOKEN",
                detail=_INVALID_RESET_TOKEN_MSG,
            )

        now = datetime.now(UTC)
        if stored.expires_at <= now:
            raise AppError(
                status_code=400,
                code="INVALID_RESET_TOKEN",
                detail=_INVALID_RESET_TOKEN_MSG,
            )

        user = await self._users.get_by_id(stored.user_id)
        if user is None or not user.is_active:
            raise AppError(
                status_code=400,
                code="INVALID_RESET_TOKEN",
                detail=_INVALID_RESET_TOKEN_MSG,
            )

        hashed = hash_password(new_password)
        await self._users.update_password(user.id, hashed)
        await self._reset_tokens.mark_used(stored)
        await self._refresh_tokens.revoke_all_for_user(user.id)
        await self._session.commit()
        return _RESET_SUCCESS_MESSAGE

    def _build_reset_url(self, raw_token: str) -> str:
        base = self._settings.web_frontend_url.rstrip("/")
        return f"{base}/login/reset-password?token={quote(raw_token, safe='')}"
