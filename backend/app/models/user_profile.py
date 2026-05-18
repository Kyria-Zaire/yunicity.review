"""Social user profile — 1:1 with auth User."""

from __future__ import annotations

import uuid
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ProfileVisibility(StrEnum):
    PUBLIC = "public"
    CITY_ONLY = "city_only"
    PRIVATE = "private"


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    username: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    interests: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    visibility: Mapped[ProfileVisibility] = mapped_column(
        String(16),
        nullable=False,
        server_default=ProfileVisibility.PUBLIC.value,
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    onboarding_step: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    notification_preferences: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )

    user: Mapped[User] = relationship("User", back_populates="profile")
