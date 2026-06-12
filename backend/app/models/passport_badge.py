"""Passport V2 badge catalog ORM (PASSPORT-03A)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

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
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class PassportBadge(TimestampMixin, Base):
    """Catalog badge definition — symbolic memory of territorial engagement."""

    __tablename__ = "passport_badges"
    __table_args__ = (
        CheckConstraint("code <> ''", name="ck_passport_badges_code_nonempty"),
        CheckConstraint(
            "family IN ('explorer', 'culture', 'citizen', 'prestige', 'creator', 'secret')",
            name="ck_passport_badges_family_valid",
        ),
        CheckConstraint(
            "visibility IN ('visible', 'secret')",
            name="ck_passport_badges_visibility_valid",
        ),
        CheckConstraint(
            "rarity IN ('common', 'rare', 'epic', 'legendary')",
            name="ck_passport_badges_rarity_valid",
        ),
        CheckConstraint(
            "reputation_reward >= 0",
            name="ck_passport_badges_reputation_reward_nonneg",
        ),
        CheckConstraint("ym_reward >= 0", name="ck_passport_badges_ym_reward_nonneg"),
        CheckConstraint("display_order >= 0", name="ck_passport_badges_display_order_nonneg"),
        Index("uq_passport_badges_code", "code", unique=True),
        Index("idx_passport_badges_family", "family"),
        Index("idx_passport_badges_visibility", "visibility"),
        Index(
            "idx_passport_badges_active_order",
            "is_active",
            "display_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    family: Mapped[str] = mapped_column(String(32), nullable=False)
    visibility: Mapped[str] = mapped_column(String(32), nullable=False)
    rarity: Mapped[str] = mapped_column(String(32), nullable=False)
    reputation_reward: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    ym_reward: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    user_badges: Mapped[list[UserPassportBadge]] = relationship(
        "UserPassportBadge",
        back_populates="badge",
        cascade="all, delete-orphan",
    )


class UserPassportBadge(Base):
    """User-earned badge — attribution logic is PASSPORT-03B."""

    __tablename__ = "user_passport_badges"
    __table_args__ = (
        Index(
            "uq_user_passport_badges_user_badge",
            "user_id",
            "badge_id",
            unique=True,
        ),
        Index(
            "idx_user_passport_badges_user_earned_at",
            "user_id",
            "earned_at",
        ),
        Index("idx_user_passport_badges_badge_id", "badge_id"),
        Index(
            "idx_user_passport_badges_source",
            "source_type",
            "source_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passport_badges.id", ondelete="CASCADE"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    source_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    user: Mapped[User] = relationship("User")
    badge: Mapped[PassportBadge] = relationship(
        "PassportBadge",
        back_populates="user_badges",
    )
