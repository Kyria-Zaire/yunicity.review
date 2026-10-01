import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.account_deletion_token import AccountDeletionToken
    from app.models.email_verification_token import EmailVerificationToken
    from app.models.passport import Passport
    from app.models.password_reset_token import PasswordResetToken
    from app.models.push_subscription import PushSubscription
    from app.models.rbac import UserRole
    from app.models.refresh_token import RefreshToken
    from app.models.user_profile import UserProfile
    from app.models.user_subscription import UserSubscription


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    #: Suppression demandee par l'utilisateur (AUTH-02A). DISTINCT de `is_active`,
    #: qui porte la suspension administrative : confondre les deux empecherait de
    #: savoir qui a decide quoi, et une reactivation d'un cote effacerait l'autre.
    #: Aucune donnee n'est supprimee tant que ces champs sont poses.
    deletion_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    #: Date a laquelle la purge definitive deviendra possible. Informative ici :
    #: AUCUN worker ne la lit, la purge fait l'objet d'un ticket distinct.
    deletion_scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    #: Derniere annulation. Conservee pour tracer la decision, pas pour bloquer
    #: une nouvelle demande.
    deletion_cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_system_account: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    force_password_reset: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        foreign_keys="UserRole.user_id",
        cascade="all, delete-orphan",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    account_deletion_tokens: Mapped[list["AccountDeletionToken"]] = relationship(
        "AccountDeletionToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    email_verification_tokens: Mapped[list["EmailVerificationToken"]] = relationship(
        "EmailVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    profile: Mapped["UserProfile | None"] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    passports: Mapped[list["Passport"]] = relationship(
        "Passport",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    push_subscriptions: Mapped[list["PushSubscription"]] = relationship(
        "PushSubscription",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    subscription: Mapped["UserSubscription | None"] = relationship(
        "UserSubscription",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
