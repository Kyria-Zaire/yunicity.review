import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.models.user import User


class EmailVerificationToken(CreatedAtMixin, Base):
    """Jeton de verification d'adresse e-mail (AUTH-01).

    Meme forme que `password_reset_tokens`, deliberement : ce gabarit est deja
    eprouve et teste. Seul le pepper differe — `EMAIL_VERIFICATION_TOKEN_PEPPER`,
    jamais celui des refresh tokens — pour qu'une compromission de l'un ne
    permette pas de forger l'autre.

    Le jeton clair n'existe qu'en transit : seul son empreinte est stockee.
    """

    __tablename__ = "email_verification_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="email_verification_tokens")
