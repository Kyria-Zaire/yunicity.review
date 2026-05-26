"""Cultural / emblematic places ORM (WEB-MAP-03)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood


class CulturalPlace(TimestampMixin, Base):
    __tablename__ = "cultural_places"
    __table_args__ = (
        UniqueConstraint("city", "slug", name="uq_cultural_places_city_slug"),
        Index("ix_cultural_places_city_active", "city", "is_active"),
        Index("ix_cultural_places_city_featured", "city", "is_featured"),
        Index("ix_cultural_places_lat_lon", "latitude", "longitude"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    neighborhood_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
    )
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_alt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_name: Mapped[str] = mapped_column(String(128), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_credit: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_license: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    neighborhood: Mapped[Neighborhood | None] = relationship("Neighborhood")
