"""Demande de suppression de compte et délai de grâce — AUTH-02A.

**Aucune donnée n'est supprimée ici.** Ce service pose un état et coupe l'accès ;
la purge définitive fait l'objet d'un ticket distinct, parce qu'elle dépend
d'arbitrages produit et juridiques encore ouverts et qu'elle est irréversible.

Trois principes :

1. **Refuser plutôt que deviner.** Un compte qui détient des rôles critiques,
   une tribu sans successeur ou un abonnement actif voit sa demande **bloquée**,
   avec l'instruction de ce qu'il faut faire avant. Rien n'est transféré,
   archivé ni résilié automatiquement : ces décisions engagent d'autres
   personnes.
2. **Distinguer suppression et suspension.** `is_active` porte la sanction
   administrative ; les champs `deletion_*` portent la décision du titulaire.
   Les confondre ferait qu'une réactivation administrative annulerait une
   demande de suppression, ou l'inverse.
3. **Ne jamais annuler par accident.** Une simple connexion ne réactive rien :
   l'annulation passe par un lien à usage unique envoyé par e-mail.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import generate_opaque_token, verify_password
from app.models.account_deletion_token import AccountDeletionToken
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.models.user_subscription import UserSubscription
from app.repositories.rbac_repository import RbacRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository

logger = logging.getLogger(__name__)

#: Rôles dont le retrait ne peut pas être décidé par leur seul titulaire : s'en
#: aller en les emportant priverait la plateforme de son administration.
CRITICAL_ROLES = frozenset({"SUPER_ADMIN", "CITY_ADMIN", "MODERATOR"})

#: Statuts d'abonnement qui engagent encore une facturation.
LIVE_SUBSCRIPTION_STATUSES = frozenset({"active", "trialing", "past_due", "unpaid"})

_CANCELLED_MESSAGE = "Votre compte est réactivé. Reconnectez-vous pour continuer."


@dataclass(frozen=True)
class DeletionRequestResult:
    scheduled_for: datetime
    #: Faux quand l'e-mail portant le lien d'annulation n'a pas pu partir.
    #: Aucune file ne le renverra : l'interface doit le dire.
    email_sent: bool


@dataclass(frozen=True)
class DeletionStatus:
    pending: bool
    requested_at: datetime | None
    scheduled_for: datetime | None


def hash_cancellation_token(raw_token: str, pepper: str) -> str:
    """Empreinte du jeton d'annulation, sous pepper DÉDIÉ."""
    return hmac.new(pepper.encode(), raw_token.encode(), hashlib.sha256).hexdigest()


class AccountDeletionService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._refresh_tokens = RefreshTokenRepository(session)

    # ------------------------------------------------------------------ garde

    def ensure_feature_enabled(self) -> None:
        """Fail-closed : sans le drapeau, la fonctionnalité n'existe pas.

        `404` plutôt que `403` : une fonctionnalité désactivée ne doit pas
        annoncer son existence, et l'interface ne la propose pas non plus.
        """
        if not self._settings.account_deletion_enabled:
            raise AppError(
                status_code=404,
                code="NOT_FOUND",
                detail="Ressource introuvable.",
            )

    # ---------------------------------------------------------------- demande

    async def request_deletion(self, user: User, password: str) -> DeletionRequestResult:
        self.ensure_feature_enabled()

        # Réauthentification : la session seule ne suffit pas pour une décision
        # irréversible, et un poste laissé ouvert ne doit pas suffire.
        if not verify_password(password, user.hashed_password):
            raise AppError(
                status_code=403,
                code="INVALID_CREDENTIALS",
                detail="Mot de passe incorrect.",
            )

        if user.deletion_requested_at is not None:
            # Idempotent : une seconde demande rend l'échéance déjà fixée plutôt
            # que de la repousser, sans quoi un double clic prolongerait le délai.
            return DeletionRequestResult(
                scheduled_for=self._scheduled_for(user),
                email_sent=False,
            )

        await self._ensure_no_critical_role(user)
        await self._ensure_no_orphan_tribe(user)
        await self._ensure_no_live_subscription(user)

        now = datetime.now(UTC)
        echeance = now + timedelta(days=self._settings.account_deletion_grace_days)
        user.deletion_requested_at = now
        user.deletion_scheduled_for = echeance
        user.deletion_cancelled_at = None

        # L'accès est coupé immédiatement. Les jetons d'accès déjà émis sont
        # refusés par `get_current_user`, qui relit l'utilisateur à chaque
        # requête : révoquer les seuls refresh tokens laisserait un quart d'heure
        # d'accès résiduel.
        await self._refresh_tokens.revoke_all_for_user(user.id)

        raw_token = generate_opaque_token()
        await self._issue_cancellation_token(user, raw_token, echeance)
        await self._session.commit()

        envoye = await self._send_cancellation_email(user, raw_token, echeance)
        logger.info("account_deletion_requested user_id=%s", user.id)
        return DeletionRequestResult(scheduled_for=echeance, email_sent=envoye)

    # -------------------------------------------------------------- blocages

    async def _ensure_no_critical_role(self, user: User) -> None:
        roles = set(await RbacRepository(self._session).get_role_keys_for_user(user.id))
        critiques = sorted(roles & CRITICAL_ROLES)
        if not critiques:
            return
        raise AppError(
            status_code=409,
            code="ADMIN_ROLE_TRANSFER_REQUIRED",
            detail=(
                "Votre compte détient des rôles d'administration. "
                "Un autre administrateur doit les retirer ou les transférer "
                "avant que la suppression puisse être demandée."
            ),
        )

    async def _ensure_no_orphan_tribe(self, user: User) -> None:
        """Refuse si une tribu créée n'a aucun successeur possible.

        On ne transfère ni n'archive automatiquement : une tribu appartient à ses
        membres autant qu'à son créateur, et ce ticket n'a pas mandat pour en
        décider. `tribes.created_by_user_id` est d'ailleurs en RESTRICT, donc la
        base refuserait elle-même la suppression plus tard.
        """
        creees = (
            await self._session.execute(
                select(Tribe.id, Tribe.name).where(Tribe.created_by_user_id == user.id)
            )
        ).all()
        if not creees:
            return

        sans_successeur: list[str] = []
        for tribe_id, nom in creees:
            autres = (
                await self._session.execute(
                    select(TribeMember.id)
                    .where(TribeMember.tribe_id == tribe_id, TribeMember.user_id != user.id)
                    .limit(1)
                )
            ).first()
            if autres is None:
                sans_successeur.append(str(nom))

        if sans_successeur:
            raise AppError(
                status_code=409,
                code="TRIBE_TRANSFER_REQUIRED",
                detail=(
                    "Vous êtes seul membre d'une ou plusieurs tribus que vous avez créées. "
                    "Transférez-les à une autre personne ou fermez-les avant de demander "
                    "la suppression de votre compte."
                ),
            )

    async def _ensure_no_live_subscription(self, user: User) -> None:
        """Refuse tant qu'un abonnement engage encore une facturation.

        AUCUN appel au prestataire de paiement n'est fait ici : prétendre qu'un
        abonnement est résilié sans confirmation de sa part serait un mensonge
        aux conséquences financières.
        """
        actif = (
            await self._session.execute(
                select(UserSubscription.id).where(
                    UserSubscription.user_id == user.id,
                    UserSubscription.status.in_(tuple(LIVE_SUBSCRIPTION_STATUSES)),
                )
            )
        ).first()
        if actif is None:
            return
        raise AppError(
            status_code=409,
            code="SUBSCRIPTION_CANCELLATION_REQUIRED",
            detail=(
                "Un abonnement est encore actif sur ce compte. "
                "Résiliez-le d'abord : la suppression ne l'interrompt pas."
            ),
        )

    # -------------------------------------------------------------- annulation

    async def cancel_deletion(self, raw_token: str) -> str:
        self.ensure_feature_enabled()

        token_hash = hash_cancellation_token(
            raw_token, self._settings.account_deletion_token_pepper
        )
        # Consommation ATOMIQUE : deux requêtes portant le même lien ne peuvent
        # pas réussir toutes les deux.
        claimed = (
            await self._session.execute(
                update(AccountDeletionToken)
                .where(
                    AccountDeletionToken.token_hash == token_hash,
                    AccountDeletionToken.used_at.is_(None),
                    AccountDeletionToken.expires_at > datetime.now(UTC),
                )
                .values(used_at=datetime.now(UTC))
                .returning(AccountDeletionToken)
            )
        ).scalar_one_or_none()

        if claimed is None:
            await self._session.rollback()
            raise AppError(
                status_code=400,
                code="INVALID_CANCELLATION_TOKEN",
                detail="Ce lien d'annulation n'est plus valide.",
            )

        user = (
            await self._session.execute(select(User).where(User.id == claimed.user_id))
        ).scalar_one_or_none()
        if user is None:
            await self._session.rollback()
            raise AppError(
                status_code=400,
                code="INVALID_CANCELLATION_TOKEN",
                detail="Ce lien d'annulation n'est plus valide.",
            )

        user.deletion_requested_at = None
        user.deletion_scheduled_for = None
        user.deletion_cancelled_at = datetime.now(UTC)

        # Les autres jetons d'annulation n'ont plus d'objet.
        await self._session.execute(
            update(AccountDeletionToken)
            .where(
                AccountDeletionToken.user_id == user.id,
                AccountDeletionToken.used_at.is_(None),
            )
            .values(used_at=datetime.now(UTC))
        )
        # Aucune session n'est restaurée : les refresh tokens révoqués à la
        # demande le restent, et l'utilisateur doit se reconnecter. Rendre la
        # main à une session ouverte avant la demande serait rouvrir un accès
        # que le titulaire avait explicitement voulu fermer.
        await self._session.commit()

        logger.info("account_deletion_cancelled user_id=%s", user.id)
        return _CANCELLED_MESSAGE

    # ------------------------------------------------------------------ etat

    @staticmethod
    def status_of(user: User) -> DeletionStatus:
        return DeletionStatus(
            pending=user.deletion_requested_at is not None,
            requested_at=user.deletion_requested_at,
            scheduled_for=user.deletion_scheduled_for,
        )

    # ------------------------------------------------------------------ outils

    def _scheduled_for(self, user: User) -> datetime:
        if user.deletion_scheduled_for is not None:
            return user.deletion_scheduled_for
        base = user.deletion_requested_at or datetime.now(UTC)
        return base + timedelta(days=self._settings.account_deletion_grace_days)

    async def _issue_cancellation_token(
        self, user: User, raw_token: str, expires_at: datetime
    ) -> None:
        self._session.add(
            AccountDeletionToken(
                user_id=user.id,
                token_hash=hash_cancellation_token(
                    raw_token, self._settings.account_deletion_token_pepper
                ),
                # L'expiration suit le délai restant : passé l'échéance, annuler
                # n'a plus d'objet.
                expires_at=expires_at,
            )
        )
        await self._session.flush()

    def build_cancellation_url(self, raw_token: str) -> str:
        base = self._settings.web_frontend_url.rstrip("/")
        return f"{base}/login/cancel-deletion?token={quote(raw_token, safe='')}"

    async def _send_cancellation_email(
        self, user: User, raw_token: str, expires_at: datetime
    ) -> bool:
        from app.integrations.resend_email import (
            EmailDeliveryError,
            send_account_deletion_email,
        )
        from app.services.email_budget import EmailBudget, EmailCategory

        # Catégorie CRITIQUE : c'est le seul moyen de revenir sur une décision
        # irréversible. Il passe avant les e-mails d'inscription.
        if not await EmailBudget(self._settings).try_consume(EmailCategory.CRITICAL):
            logger.warning("account_deletion_email_not_sent reason=budget user_id=%s", user.id)
            return False
        try:
            await send_account_deletion_email(
                to=user.email,
                cancellation_url=self.build_cancellation_url(raw_token),
                scheduled_for=expires_at,
                settings=self._settings,
            )
        except EmailDeliveryError:
            logger.exception("account_deletion_email_not_sent reason=provider user_id=%s", user.id)
            return False
        return True
