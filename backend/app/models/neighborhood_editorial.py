"""Quartiers V2 editorial ORM (FEATURE-QUARTIERS-V2 / Q2-S1-01)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood
    from app.models.user import User


class NeighborhoodAlias(TimestampMixin, Base):
    __tablename__ = "neighborhood_aliases"
    __table_args__ = (
        Index("ix_neighborhood_aliases_neighborhood_id", "neighborhood_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    alias: Mapped[str] = mapped_column(String(120), nullable=False)
    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    neighborhood: Mapped[Neighborhood] = relationship("Neighborhood", back_populates="aliases")


class NeighborhoodMoodTag(Base):
    __tablename__ = "neighborhood_mood_tags"

    slug: Mapped[str] = mapped_column(String(32), primary_key=True)
    label: Mapped[str] = mapped_column(String(64), nullable=False)

    assignments: Mapped[list[NeighborhoodMoodAssignment]] = relationship(
        "NeighborhoodMoodAssignment",
        back_populates="mood_tag",
    )


class NeighborhoodMoodAssignment(TimestampMixin, Base):
    __tablename__ = "neighborhood_mood_assignments"
    __table_args__ = (
        UniqueConstraint(
            "neighborhood_id",
            "mood_slug",
            name="uq_neighborhood_mood_assignments_hood_mood",
        ),
        Index("ix_neighborhood_mood_assignments_neighborhood_id", "neighborhood_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    mood_slug: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("neighborhood_mood_tags.slug", ondelete="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood", back_populates="mood_assignments"
    )
    mood_tag: Mapped[NeighborhoodMoodTag] = relationship(
        "NeighborhoodMoodTag",
        back_populates="assignments",
    )


class NeighborhoodTimelineEntry(TimestampMixin, Base):
    __tablename__ = "neighborhood_timeline_entries"
    __table_args__ = (
        Index(
            "ix_neighborhood_timeline_entries_hood_year",
            "neighborhood_id",
            "year",
            "sort_order",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood",
        back_populates="timeline_entries",
    )


class NeighborhoodContribution(TimestampMixin, Base):
    __tablename__ = "neighborhood_contributions"
    __table_args__ = (
        Index("ix_neighborhood_contributions_hood_status", "neighborhood_id", "status"),
        Index("ix_neighborhood_contributions_status_created", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood",
        back_populates="contributions",
    )
    author: Mapped[User] = relationship("User", foreign_keys=[author_user_id])
    reviewer: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by])
