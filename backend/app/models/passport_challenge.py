"""Passport V2 challenge catalog ORM (PASSPORT-04A)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class PassportChallenge(TimestampMixin, Base):
    """Challenge catalog definition — progression logic is PASSPORT-04B+."""

    __tablename__ = "passport_challenges"
    __table_args__ = (
        CheckConstraint("code <> ''", name="ck_passport_challenges_code_nonempty"),
        CheckConstraint(
            "family IN ('explorer', 'citizen', 'culture', 'prestige')",
            name="ck_passport_challenges_family_valid",
        ),
        CheckConstraint(
            "rarity IN ('common', 'rare', 'epic', 'legendary')",
            name="ck_passport_challenges_rarity_valid",
        ),
        CheckConstraint(
            "challenge_type IN ('stamps', 'redemptions', 'events', 'manual')",
            name="ck_passport_challenges_type_valid",
        ),
        CheckConstraint("target_value > 0", name="ck_passport_challenges_target_positive"),
        CheckConstraint("ym_reward >= 0", name="ck_passport_challenges_ym_reward_nonneg"),
        CheckConstraint(
            "display_order >= 0",
            name="ck_passport_challenges_display_order_nonneg",
        ),
        Index("uq_passport_challenges_code", "code", unique=True),
        Index("idx_passport_challenges_family", "family"),
        Index(
            "idx_passport_challenges_active_order",
            "is_active",
            "display_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    family: Mapped[str] = mapped_column(String(32), nullable=False)
    rarity: Mapped[str] = mapped_column(String(32), nullable=False)
    challenge_type: Mapped[str] = mapped_column(String(32), nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    ym_reward: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    badge_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    user_challenges: Mapped[list[UserPassportChallenge]] = relationship(
        "UserPassportChallenge",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )


class UserPassportChallenge(TimestampMixin, Base):
    """User challenge progress — updates are PASSPORT-04B+, not in this ticket."""

    __tablename__ = "user_passport_challenges"
    __table_args__ = (
        CheckConstraint("progress >= 0", name="ck_user_passport_challenges_progress_nonneg"),
        CheckConstraint(
            "target_value > 0",
            name="ck_user_passport_challenges_target_positive",
        ),
        Index(
            "uq_user_passport_challenges_user_challenge",
            "user_id",
            "challenge_id",
            unique=True,
        ),
        Index("idx_user_passport_challenges_user", "user_id"),
        Index("idx_user_passport_challenges_completed", "completed"),
        Index("idx_user_passport_challenges_reward_claimed", "reward_claimed"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    challenge_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passport_challenges.id", ondelete="CASCADE"), nullable=False
    )
    progress: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reward_claimed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    user: Mapped[User] = relationship("User")
    challenge: Mapped[PassportChallenge] = relationship(
        "PassportChallenge",
        back_populates="user_challenges",
    )
