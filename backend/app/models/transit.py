"""Grand Reims / CITURA transit (WEB-MAP-02) — GTFS scheduled departures."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TransitDeparture(Base):
    __tablename__ = "transit_departures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transit_stops.id", ondelete="CASCADE"),
        nullable=False,
    )
    route_short_name: Mapped[str] = mapped_column(String(32), nullable=False)
    route_type: Mapped[str] = mapped_column(String(16), nullable=False)
    headsign: Mapped[str] = mapped_column(String(255), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    realtime: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    stop: Mapped[TransitStop] = relationship("TransitStop", back_populates="departures")


class TransitStop(Base):
    __tablename__ = "transit_stops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_stop_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False, default="Reims")

    departures: Mapped[list[TransitDeparture]] = relationship(
        "TransitDeparture",
        back_populates="stop",
        cascade="all, delete-orphan",
    )


class TransitFeedMeta(Base):
    __tablename__ = "transit_feed_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    mode: Mapped[str] = mapped_column(String(16), nullable=False)
    gtfs_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True)
