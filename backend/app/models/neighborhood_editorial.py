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
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.cultural_place import CulturalPlace
    from app.models.neighborhood import Neighborhood
    from app.models.user import User


class NeighborhoodAlias(TimestampMixin, Base):
    __tablename__ = "neighborhood_aliases"
    __table_args__ = (Index("ix_neighborhood_aliases_neighborhood_id", "neighborhood_id"),)

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
        Index("ix_neighborhood_contributions_author_status", "author_user_id", "status"),
        Index(
            "ix_neighborhood_contributions_author_hood_status",
            "author_user_id",
            "neighborhood_id",
            "status",
        ),
        Index(
            "ix_neighborhood_contributions_hood_approved_at",
            "neighborhood_id",
            "approved_at",
            postgresql_ops={"approved_at": "DESC"},
            postgresql_where=text("status = 'approved'"),
        ),
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
    display_identity_type: Mapped[str] = mapped_column(String(16), nullable=False, default="pseudo")
    display_identity_label: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    passport_verified_snapshot: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    rejection_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood",
        back_populates="contributions",
    )
    author: Mapped[User] = relationship("User", foreign_keys=[author_user_id])
    reviewer: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by])


class NeighborhoodCommunityTag(Base):
    """Catalogue de tags communautes (QUARTIER-01 phase 3a).

    Calque sur NeighborhoodMoodTag. Les suggestions de tribus sont resolues a la lecture
    (le tag alimente une recherche par categorie/nom de tribu) plutot que stockees en lien
    dur : les tribus sont creees par les utilisateurs et laisseraient des lignes orphelines.
    """

    __tablename__ = "neighborhood_community_tags"

    slug: Mapped[str] = mapped_column(String(32), primary_key=True)
    label: Mapped[str] = mapped_column(String(64), nullable=False)

    assignments: Mapped[list[NeighborhoodCommunityTagAssignment]] = relationship(
        "NeighborhoodCommunityTagAssignment",
        back_populates="tag",
    )


class NeighborhoodCommunityTagAssignment(TimestampMixin, Base):
    __tablename__ = "neighborhood_community_tag_assignments"
    __table_args__ = (
        UniqueConstraint(
            "neighborhood_id",
            "tag_slug",
            name="uq_neighborhood_community_tag_hood_tag",
        ),
        Index(
            "ix_neighborhood_community_tag_assignments_neighborhood_id",
            "neighborhood_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    tag_slug: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("neighborhood_community_tags.slug", ondelete="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood",
        back_populates="community_tag_assignments",
    )
    tag: Mapped[NeighborhoodCommunityTag] = relationship(
        "NeighborhoodCommunityTag",
        back_populates="assignments",
    )


class NeighborhoodLandmark(TimestampMixin, Base):
    """Lieu emblematique d'un quartier — reference vers cultural_places.

    Table de liaison plutot qu'un drapeau sur cultural_places : la selection peut etre curee
    et ordonnee, et un lieu peut etre emblematique d'un quartier sans y etre administrative-
    ment rattache (cas reel : Porte de Paris, centre-ville selon OSM, Courlancy editorialement).
    """

    __tablename__ = "neighborhood_landmarks"
    __table_args__ = (
        UniqueConstraint(
            "neighborhood_id",
            "cultural_place_id",
            name="uq_neighborhood_landmarks_hood_place",
        ),
        Index("ix_neighborhood_landmarks_neighborhood_id", "neighborhood_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="CASCADE"),
        nullable=False,
    )
    cultural_place_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("cultural_places.id", ondelete="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    neighborhood: Mapped[Neighborhood] = relationship(
        "Neighborhood",
        back_populates="landmarks",
    )
    cultural_place: Mapped[CulturalPlace] = relationship("CulturalPlace")
