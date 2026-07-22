"""Neighborhood catalog ORM (TICKET-602)."""

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
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.local_event import LocalEvent
    from app.models.neighborhood_editorial import (
        NeighborhoodAlias,
        NeighborhoodCommunityTagAssignment,
        NeighborhoodContribution,
        NeighborhoodLandmark,
        NeighborhoodMoodAssignment,
        NeighborhoodTimelineEntry,
    )
    from app.models.organization import Organization
    from app.models.passport import PartnerOffer
    from app.models.post import Post


class Neighborhood(TimestampMixin, Base):
    """Editorial neighborhood catalog — staff-managed, not user-created."""

    __tablename__ = "neighborhoods"
    __table_args__ = (
        UniqueConstraint("city", "slug", name="uq_neighborhoods_city_slug"),
        Index("ix_neighborhoods_city_active", "city", "is_active"),
        Index("ix_neighborhoods_city_featured", "city", "is_featured"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ambiance: Mapped[str | None] = mapped_column(String(32), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    accent_color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    radius_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_featured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        nullable=False,
        server_default=text("''::tsvector"),
    )
    long_story: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_locals_love: Mapped[str | None] = mapped_column(Text, nullable=True)
    featured_quote: Mapped[str | None] = mapped_column(String(512), nullable=True)
    official_label: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Identite et vie du quartier (QUARTIER-01 phase 3a) — texte libre, nullable : les
    # douze quartiers se remplissent au fil de la redaction editoriale.
    audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    neighborhood_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_life: Mapped[str | None] = mapped_column(Text, nullable=True)
    green_spaces: Mapped[str | None] = mapped_column(Text, nullable=True)
    mobility: Mapped[str | None] = mapped_column(Text, nullable=True)
    daily_life: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_image_storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    editorial_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    editorial_updated_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    posts: Mapped[list[Post]] = relationship("Post", back_populates="neighborhood")
    local_events: Mapped[list[LocalEvent]] = relationship(
        "LocalEvent", back_populates="neighborhood"
    )
    organizations: Mapped[list[Organization]] = relationship(
        "Organization", back_populates="neighborhood"
    )
    partner_offers: Mapped[list[PartnerOffer]] = relationship(
        "PartnerOffer", back_populates="neighborhood"
    )
    aliases: Mapped[list[NeighborhoodAlias]] = relationship(
        "NeighborhoodAlias",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
    )
    mood_assignments: Mapped[list[NeighborhoodMoodAssignment]] = relationship(
        "NeighborhoodMoodAssignment",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
    )
    timeline_entries: Mapped[list[NeighborhoodTimelineEntry]] = relationship(
        "NeighborhoodTimelineEntry",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
    )
    community_tag_assignments: Mapped[list[NeighborhoodCommunityTagAssignment]] = relationship(
        "NeighborhoodCommunityTagAssignment",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
    )
    landmarks: Mapped[list[NeighborhoodLandmark]] = relationship(
        "NeighborhoodLandmark",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
        order_by="NeighborhoodLandmark.sort_order",
    )
    contributions: Mapped[list[NeighborhoodContribution]] = relationship(
        "NeighborhoodContribution",
        back_populates="neighborhood",
        cascade="all, delete-orphan",
    )
