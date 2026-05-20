"""Neighborhood catalog ORM (TICKET-602)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Index, Integer, Numeric, String, Text, UniqueConstraint, Uuid, text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.local_event import LocalEvent
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
