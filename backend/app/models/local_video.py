"""Local Video ORM (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.cultural_place import CulturalPlace
    from app.models.local_event import LocalEvent
    from app.models.neighborhood import Neighborhood
    from app.models.organization import Organization
    from app.models.tribe import Tribe
    from app.models.user import User


class LocalVideoUpload(TimestampMixin, Base):
    """Pending upload session before publish (presigned / dev binary PUT)."""

    __tablename__ = "local_video_uploads"
    __table_args__ = (
        Index("ix_local_video_uploads_author_created", "author_user_id", "created_at"),
        Index("ix_local_video_uploads_status_expires", "status", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    expected_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped[User] = relationship("User")


class LocalVideo(TimestampMixin, Base):
    """Territorial short video — distinct from Stories and PartnerCreatorContent."""

    __tablename__ = "local_videos"
    __table_args__ = (
        Index("ix_local_videos_city_status_published", "city", "status", "published_at"),
        Index("ix_local_videos_neighborhood_status", "neighborhood_id", "status"),
        Index("ix_local_videos_author_created", "author_user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    upload_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("local_video_uploads.id", ondelete="SET NULL"),
        nullable=True,
    )
    city: Mapped[str] = mapped_column(String(64), nullable=False)
    neighborhood_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="RESTRICT"),
        nullable=False,
    )
    video_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    cultural_place_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("cultural_places.id", ondelete="SET NULL"),
        nullable=True,
    )
    local_event_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("local_events.id", ondelete="SET NULL"),
        nullable=True,
    )
    tribe_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("tribes.id", ondelete="SET NULL"),
        nullable=True,
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    media_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    media_width: Mapped[int | None] = mapped_column(nullable=True)
    media_height: Mapped[int | None] = mapped_column(nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="processing")
    processing_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    review_priority: Mapped[bool] = mapped_column(
        nullable=False, default=False, server_default="false"
    )
    like_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    comment_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    view_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    author: Mapped[User] = relationship("User")
    neighborhood: Mapped[Neighborhood] = relationship("Neighborhood")
    cultural_place: Mapped[CulturalPlace | None] = relationship("CulturalPlace")
    local_event: Mapped[LocalEvent | None] = relationship("LocalEvent")
    tribe: Mapped[Tribe | None] = relationship("Tribe")
    organization: Mapped[Organization | None] = relationship("Organization")
