"""Feed post ORM (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.like import Like
    from app.models.local_event import LocalEvent
    from app.models.neighborhood import Neighborhood
    from app.models.partner_creator_content import PartnerCreatorContent
    from app.models.passport import PartnerOffer
    from app.models.report import Report
    from app.models.tribe import Tribe


class Post(TimestampMixin, Base):
    __tablename__ = "posts"
    __table_args__ = (
        Index("ix_posts_city_created_at", "city", "created_at"),
        Index("ix_posts_author", "author_type", "author_id"),
        Index("ix_posts_is_active_created_at", "is_active", "created_at"),
        Index("ix_posts_tribe_created_at", "tribe_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    author_type: Mapped[str] = mapped_column(String(20), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="post")
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    discussion_category: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    discussion_tags: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    comment_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    partner_offer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("partner_offers.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    partner_creator_content_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("partner_creator_contents.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    local_event_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("local_events.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    neighborhood_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tribe_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("tribes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    linked_tribe_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("tribes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_story: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    story_category: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    story_location_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    story_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    story_audience: Mapped[str] = mapped_column(
        String(24), nullable=False, server_default="public"
    )
    story_tags: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    story_media_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    view_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        nullable=False,
        server_default=text("''::tsvector"),
    )

    partner_offer: Mapped[PartnerOffer | None] = relationship(
        "PartnerOffer",
        foreign_keys=[partner_offer_id],
    )
    partner_creator_content: Mapped[PartnerCreatorContent | None] = relationship(
        "PartnerCreatorContent",
        back_populates="post",
        foreign_keys=[partner_creator_content_id],
    )
    local_event: Mapped[LocalEvent | None] = relationship(
        "LocalEvent",
        foreign_keys=[local_event_id],
    )
    neighborhood: Mapped[Neighborhood | None] = relationship(
        "Neighborhood",
        back_populates="posts",
    )
    tribe: Mapped[Tribe | None] = relationship("Tribe", back_populates="posts", foreign_keys=[tribe_id])
    linked_tribe: Mapped[Tribe | None] = relationship("Tribe", foreign_keys=[linked_tribe_id])
    likes: Mapped[list[Like]] = relationship(
        "Like",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    comments: Mapped[list[Comment]] = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    reports: Mapped[list[Report]] = relationship(
        "Report",
        back_populates="post",
        cascade="all, delete-orphan",
    )

    @property
    def location_point(self) -> dict[str, float] | None:
        if self.latitude is None or self.longitude is None:
            return None
        return {"latitude": self.latitude, "longitude": self.longitude}

    def set_location(self, latitude: float | None, longitude: float | None) -> None:
        self.latitude = latitude
        self.longitude = longitude
