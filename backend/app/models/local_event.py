"""Local events & citizen interests (TICKET-505)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.local_event_constants import (
    DEFAULT_EVENT_TIMEZONE,
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood
    from app.models.organization import Organization
    from app.models.user import User


class LocalEvent(TimestampMixin, Base):
    __tablename__ = "local_events"
    __table_args__ = (
        Index("ix_local_events_city_starts_at", "city", "starts_at"),
        Index("ix_local_events_organization_id", "organization_id"),
        Index("ix_local_events_moderation_starts", "moderation_status", "starts_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    district: Mapped[str | None] = mapped_column(String(128), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default=DEFAULT_EVENT_TIMEZONE
    )
    location_name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    visibility: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default=LocalEventVisibility.PUBLIC.value,
    )
    moderation_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default=LocalEventModerationStatus.PENDING_REVIEW.value,
    )
    moderated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    neighborhood_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        nullable=False,
        server_default=text("''::tsvector"),
    )

    organization: Mapped[Organization | None] = relationship("Organization")
    neighborhood: Mapped[Neighborhood | None] = relationship(
        "Neighborhood", back_populates="local_events"
    )
    created_by_user: Mapped[User] = relationship("User", foreign_keys=[created_by_user_id])
    interests: Mapped[list[EventInterest]] = relationship(
        "EventInterest",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class EventInterest(TimestampMixin, Base):
    __tablename__ = "event_interests"
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_event_interests_user_event"),
        Index("ix_event_interests_user_id", "user_id"),
        Index("ix_event_interests_event_id", "event_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("local_events.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped[User] = relationship("User")
    event: Mapped[LocalEvent] = relationship("LocalEvent", back_populates="interests")
