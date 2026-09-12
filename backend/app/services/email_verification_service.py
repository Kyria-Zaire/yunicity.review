"""Verification d'adresse e-mail — AUTH-01.

Trois regles portent ce module :

1. **Aucun compte existant ne peut etre bloque.** L'exigence ne vise que les
   comptes crees a partir de `EMAIL_VERIFICATION_ENFORCED_FROM`. Non configuree,
   elle est DESACTIVEE : installer cette version ne change le comportement
   d'aucun deploiement, et les comptes deja ouverts restent accessibles, ni
   bloques ni marques verifies.
2. **Le jeton clair n'existe qu'en transit.** Seule son empreinte, calculee avec
   un pepper DEDIE, est stockee ; il n'apparait ni en base, ni en journal.
3. **Rien ne revele l'existence d'une adresse.** Le renvoi repond toujours la
   meme chose : compte connu, deja verifie, ou inexistant.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import generate_opaque_token, normalize_email
from app.integrations.resend_email import (
    EmailDeliveryError,
    send_email_verification_email,
)
from app.models.user import User
from app.repositories.email_verification_token_repository import (
    EmailVerificationTokenRepository,
)
from app.repositories.user_repository import UserRepository
from app.services.email_budget import EmailBudget, EmailCategory

logger = logging.getLogger(__name__)

#: Reponse unique du renvoi : identique pour une adresse connue, deja verifiee,
#: ou inexistante. Toute variation permettrait d'enumerer les comptes.
GENERIC_RESEND_MESSAGE = (
    "Si un compte non vérifié existe avec cette adresse, vous allez recevoir "
    "un e-mail de confirmation."
)
VERIFIED_MESSAGE = "Votre adresse e-mail est confirmée."

#: Delai minimal entre deux envois pour un meme compte. Complete la limite de
#: debit : celle-ci protege le service, celui-ci protege la boite du destinataire.
RESEND_MIN_INTERVAL_SECONDS = 60

_REJECTION_DETAILS = {
    "INVALID_VERIFICATION_TOKEN": "Ce lien de confirmation n'est pas valide.",
    "VERIFICATION_TOKEN_ALREADY_USED": "Ce lien a déjà été utilisé.",
    "VERIFICATION_TOKEN_EXPIRED": "Ce lien de confirmation a expiré.",
}


def email_verification_required_for(user: User, settings: Settings) -> bool:
    """Ce compte doit-il avoir verifie son adresse pour ouvrir une session ?

    Definition UNIQUE de la regle : `AuthService` et ce service s'y referent tous
    les deux, pour qu'il n'existe aucun endroit ou la reponse puisse diverger.

    Sans `EMAIL_VERIFICATION_ENFORCED_FROM`, la reponse est toujours `False` :
    un oubli de configuration ne peut pas bloquer un compte.
    """
    threshold = settings.email_verification_enforced_from
    if threshold is None:
        return False
    if threshold.tzinfo is None:
        threshold = threshold.replace(tzinfo=UTC)
    # `created_at` est non nullable et renseigne des le flush ; un objet non
    # persiste leverait ici plutot que de contourner silencieusement la regle.
    created = user.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=UTC)
    return created >= threshold


def hash_verification_token(raw_token: str, pepper: str) -> str:
    """Empreinte du jeton.

    Pepper DEDIE (`EMAIL_VERIFICATION_TOKEN_PEPPER`) : compromettre le pepper des
    refresh tokens ne doit pas permettre de forger un lien de verification.
    """
    return hashlib.sha256(f"{pepper}{raw_token}".encode()).hexdigest()


@dataclass(frozen=True)
class ResendResult:
    message: str


class EmailVerificationService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._tokens = EmailVerificationTokenRepository(session)

    def build_verification_url(self, raw_token: str) -> str:
        base = self._settings.web_frontend_url.rstrip("/")
        return f"{base}/login/verify-email?token={quote(raw_token, safe='')}"

    async def issue_and_send(self, user: User) -> bool:
        """Emet un jeton neuf, invalide les precedents, envoie l'e-mail.

        Rend True si l'e-mail est effectivement parti. Aucune file de reprise
        n'existe : quand il ne part pas, rien ne le renverra tout seul. Le jeton
        reste valide en base et le renvoi manuel regenere un lien — c'est
        l'appelant qui doit le DIRE a l'utilisateur plutot que de pretendre
        qu'un e-mail est en route.

        Ne leve pas si l'envoi echoue : le compte vient d'etre cree et valide,
        le jeton est en base, et le renvoi permet de reprendre. Propager ici
        ferait perdre une inscription pour une panne de fournisseur d'e-mail.
        L'appelant reste responsable du commit.
        """
        raw_token = generate_opaque_token()
        token_hash = hash_verification_token(
            raw_token, self._settings.email_verification_token_pepper
        )
        expires_at = datetime.now(UTC) + timedelta(
            hours=self._settings.email_verification_expire_hours
        )

        await self._tokens.invalidate_unused_for_user(user.id)
        await self._tokens.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        if not await EmailBudget(self._settings).try_consume(EmailCategory.ROUTINE):
            # Budget indisponible ou epuise. Le compte existe et son jeton est en
            # base : il reste recuperable par un renvoi, mais AUCUNE reprise
            # automatique ne l'enverra.
            logger.warning("email_verification_not_sent reason=budget user_id=%s", user.id)
            return False

        try:
            await send_email_verification_email(
                to=user.email,
                verification_url=self.build_verification_url(raw_token),
                settings=self._settings,
            )
        except EmailDeliveryError:
            logger.exception("email_verification_not_sent reason=provider user_id=%s", user.id)
            return False
        return True

    async def resend(self, email: str) -> ResendResult:
        """Renvoie un lien. Repond la meme chose quoi qu'il arrive."""
        user = await self._users.get_by_email(normalize_email(email))

        if user is not None and user.is_active and not user.is_verified:
            if not await self._cooldown_elapsed(user):
                # Meme message, meme code : un 429 distinctif ici revelerait
                # qu'un compte non verifie existe a cette adresse.
                return ResendResult(message=GENERIC_RESEND_MESSAGE)
            await self.issue_and_send(user)
            await self._session.commit()

        return ResendResult(message=GENERIC_RESEND_MESSAGE)

    async def _cooldown_elapsed(self, user: User) -> bool:
        last = await self._tokens.latest_issued_at_for_user(user.id)
        if last is None:
            return True
        if last.tzinfo is None:
            last = last.replace(tzinfo=UTC)
        return (datetime.now(UTC) - last).total_seconds() >= RESEND_MIN_INTERVAL_SECONDS

    async def verify(self, raw_token: str) -> str:
        """Consomme le jeton et marque l'adresse verifiee."""
        token_hash = hash_verification_token(
            raw_token, self._settings.email_verification_token_pepper
        )

        claimed = await self._tokens.claim(token_hash)
        if claimed is not None:
            user = await self._users.get_by_id(claimed.user_id)
            if user is None:
                await self._session.rollback()
                raise _rejection("INVALID_VERIFICATION_TOKEN")
            user.is_verified = True
            await self._session.commit()
            return VERIFIED_MESSAGE

        # Le jeton n'a pas ete consomme : on qualifie la cause pour que
        # l'interface propose la bonne action, sans jamais rien accorder.
        raise _rejection(await self._rejection_code(token_hash))

    async def _rejection_code(self, token_hash: str) -> str:
        existing = await self._tokens.get_by_hash(token_hash)
        if existing is None:
            return "INVALID_VERIFICATION_TOKEN"
        if existing.used_at is not None:
            return "VERIFICATION_TOKEN_ALREADY_USED"
        return "VERIFICATION_TOKEN_EXPIRED"


def _rejection(code: str) -> AppError:
    return AppError(status_code=400, code=code, detail=_REJECTION_DETAILS[code])
