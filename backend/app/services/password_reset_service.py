"""Password reset business logic (forgot / reset)."""

from __future__ import annotations

import logging
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
from app.services.email_budget import EmailBudget, EmailCategory

logger = logging.getLogger(__name__)

GENERIC_FORGOT_MESSAGE = (
    "Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
)
_INVALID_RESET_TOKEN_MSG = "Lien de réinitialisation invalide ou expiré."
_RESET_SUCCESS_MESSAGE = "Votre mot de passe a été mis à jour."


@dataclass(frozen=True)
class ForgotPasswordResult:
    """Resultat de la demande.

    Ne porte QUE le message generique. Le lien de reinitialisation vaut un mot de
    passe a usage unique : il ne transite que par l'e-mail, jamais par la reponse
    HTTP (AUTH-03). Un champ optionnel qui ne se remplit que hors production est
    exactement le genre de chose qu'un deploiement `recette` ou `preprod` reactive
    sans que personne s'en apercoive.
    """

    message: str


class PasswordResetService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._reset_tokens = PasswordResetTokenRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)

    async def request_password_reset(self, email: str) -> ForgotPasswordResult:
        """Emet un lien de reinitialisation et l'envoie. Repond toujours la meme chose.

        Le message est identique pour une adresse connue, inconnue ou desactivee :
        toute variation permettrait d'enumerer les comptes.
        """
        normalized = normalize_email(email)
        user = await self._users.get_by_email(normalized)

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

            # L'envoi est tente dans TOUS les environnements. C'est le fournisseur
            # configure qui decide de ce qui part reellement : `none` n'envoie rien,
            # `console` trace sans divulguer, `resend` expedie. Conditionner l'envoi
            # a `app_env == "prod"` laissait recette et preprod sans aucun e-mail,
            # et donc sans autre moyen de recuperer le lien que la reponse HTTP.
            # Categorie CRITIQUE : la recuperation de compte est le dernier
            # envoi a s'eteindre, et peut entamer la reserve.
            budget_ok = await EmailBudget(self._settings).try_consume(EmailCategory.CRITICAL)
            try:
                if not budget_ok:
                    raise EmailDeliveryError("daily email budget exhausted")
                await send_password_reset_email(
                    to=normalized,
                    reset_url=self._build_reset_url(raw_token),
                    settings=self._settings,
                )
            except EmailDeliveryError:
                # Volontairement NON propage. Un 503 ne survient que si le compte
                # existe — puisque l'envoi n'est tente que dans ce cas. Pendant une
                # panne du fournisseur, la paire 503/200 devient donc un oracle
                # d'existence d'adresse. La panne est tracee pour l'exploitation ;
                # l'appelant, lui, recoit la meme reponse dans tous les cas.
                logger.exception("password_reset_send_failed user_id=%s", user.id)

            await self._session.commit()

        return ForgotPasswordResult(message=GENERIC_FORGOT_MESSAGE)

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
