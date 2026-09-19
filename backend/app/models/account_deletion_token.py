import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.models.user import User


class AccountDeletionToken(Base, CreatedAtMixin):
    """Jeton d'annulation d'une demande de suppression (AUTH-02A).

    Meme gabarit eprouve que les jetons de verification et de reinitialisation :
    seul un condensat est stocke, avec un pepper DEDIE. Le lien d'annulation
    permet de reprendre la main sur un compte ; le compromettre reviendrait a
    empecher quelqu'un de se supprimer, ou a annuler sa decision a sa place.

    L'expiration suit le delai de grace restant : passe la date de suppression
    prevue, un jeton d'annulation n'a plus d'objet.
    """

    __tablename__ = "account_deletion_tokens"

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

    user: Mapped["User"] = relationship("User", back_populates="account_deletion_tokens")
