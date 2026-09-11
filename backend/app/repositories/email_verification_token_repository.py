import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification_token import EmailVerificationToken


class EmailVerificationTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        """Lecture SANS consommation — sert uniquement a qualifier un echec."""
        result = await self._session.execute(
            select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> EmailVerificationToken:
        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def claim(
        self, token_hash: str, *, now: datetime | None = None
    ) -> EmailVerificationToken | None:
        """Consomme le jeton ATOMIQUEMENT, ou rend None.

        Un seul UPDATE conditionnel : la base arbitre. Deux requetes simultanees
        portant le meme jeton ne peuvent pas gagner toutes les deux — la seconde
        ne trouve plus de ligne satisfaisant `used_at IS NULL`. Un read-modify-write
        laisserait au contraire une fenetre de double consommation.
        """
        instant = now or datetime.now(UTC)
        result = await self._session.execute(
            update(EmailVerificationToken)
            .where(
                EmailVerificationToken.token_hash == token_hash,
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.expires_at > instant,
            )
            .values(used_at=instant)
            .returning(EmailVerificationToken)
        )
        return result.scalar_one_or_none()

    async def invalidate_unused_for_user(self, user_id: uuid.UUID) -> None:
        now = datetime.now(UTC)
        await self._session.execute(
            update(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.used_at.is_(None),
            )
            .values(used_at=now)
        )
        await self._session.flush()

    async def latest_issued_at_for_user(self, user_id: uuid.UUID) -> datetime | None:
        """Date d'emission du dernier jeton, pour le delai minimal entre deux envois."""
        result = await self._session.execute(
            select(EmailVerificationToken.created_at)
            .where(EmailVerificationToken.user_id == user_id)
            .order_by(EmailVerificationToken.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
