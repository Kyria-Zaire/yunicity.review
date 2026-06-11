"""Passport V2 reputation ORM — event journal + materialized snapshots (PASSPORT-01A)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.models.user import User


class ReputationEvent(CreatedAtMixin, Base):
    """Append-only reputation attribution — never deleted or decremented."""

    __tablename__ = "reputation_events"
    __table_args__ = (
        CheckConstraint("points > 0", name="ck_reputation_events_points_positive"),
        CheckConstraint("event_type <> ''", name="ck_reputation_events_event_type_nonempty"),
        CheckConstraint("source_type <> ''", name="ck_reputation_events_source_type_nonempty"),
        Index(
            "idx_reputation_events_user_created_at",
            "user_id",
            "created_at",
        ),
        Index(
            "idx_reputation_events_source",
            "source_type",
            "source_id",
        ),
        Index("idx_reputation_events_event_type", "event_type"),
        Index(
            "uq_reputation_events_idempotent_source",
            "user_id",
            "event_type",
            "source_type",
            "source_id",
            unique=True,
            postgresql_where=text("source_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    user: Mapped[User] = relationship("User")


class UserReputationSnapshot(Base):
    """Materialized total per user — kept in sync by PassportReputationService."""

    __tablename__ = "user_reputation_snapshots"
    __table_args__ = (
        CheckConstraint("total_points >= 0", name="ck_user_reputation_snapshots_total_nonneg"),
        Index("idx_user_reputation_snapshots_total_points", "total_points"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    total_points: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    last_event_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship("User")
