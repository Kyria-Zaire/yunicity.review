"""Tribe ORM (FEATURE-A / TICKET-A.2)."""

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
    SmallInteger,
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
    from app.models.organization import Organization
    from app.models.post import Post
    from app.models.user import User


class Tribe(TimestampMixin, Base):
    __tablename__ = "tribes"
    __table_args__ = (
        UniqueConstraint("city", "slug", name="uq_tribes_city_slug"),
        Index("ix_tribes_city_visibility", "city", "visibility"),
        Index("ix_tribes_city_featured", "city", "is_featured"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    visibility: Mapped[str] = mapped_column(String(24), nullable=False)
    persistence_kind: Mapped[str] = mapped_column(
        String(24), nullable=False, server_default="persistent"
    )
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    charter_version: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="1")
    member_limit: Mapped[int] = mapped_column(Integer, nullable=False, server_default="150")
    is_featured: Mapped[bool] = mapped_column(nullable=False, server_default="false", default=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        nullable=False,
        server_default=text("''::tsvector"),
    )

    created_by: Mapped[User] = relationship("User", foreign_keys=[created_by_user_id])
    organization: Mapped[Organization | None] = relationship("Organization")
    members: Mapped[list[TribeMember]] = relationship(
        "TribeMember", back_populates="tribe", cascade="all, delete-orphan"
    )
    posts: Mapped[list[Post]] = relationship(
        "Post",
        back_populates="tribe",
        foreign_keys="Post.tribe_id",
    )


class TribeMember(Base):
    __tablename__ = "tribe_members"
    __table_args__ = (
        UniqueConstraint("tribe_id", "user_id", name="uq_tribe_members_tribe_user"),
        Index("ix_tribe_members_user_active", "user_id"),
        Index("ix_tribe_members_tribe_active", "tribe_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tribe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tribes.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    invited_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    charter_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Mute des notifications de la tribu pour ce membre (bloc 3 — temps réel/notifs).
    notifications_muted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    tribe: Mapped[Tribe] = relationship("Tribe", back_populates="members")
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])


class TribeInvitation(Base):
    __tablename__ = "tribe_invitations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tribe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tribes.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    invited_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    invited_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    tribe: Mapped[Tribe] = relationship("Tribe")


class TribeModerationLog(Base):
    """Audit trail for tribe moderation (TICKET-A.2)."""

    __tablename__ = "tribe_moderation_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tribe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tribes.id", ondelete="CASCADE"), nullable=False
    )
    actor_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    target_post_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
