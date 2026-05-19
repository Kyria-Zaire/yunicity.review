"""In-app notification inbox (TICKET-503)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Index, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.post import Post
    from app.models.user import User


class UserNotification(TimestampMixin, Base):
    __tablename__ = "user_notifications"
    __table_args__ = (
        Index("ix_user_notifications_target_user_created", "target_user_id", "created_at"),
        Index("ix_user_notifications_target_user_unread", "target_user_id", "is_read"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    target_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_post_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True
    )
    deeplink: Mapped[str | None] = mapped_column(String(512), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    actor: Mapped[User | None] = relationship("User", foreign_keys=[actor_id])
    target_user: Mapped[User] = relationship("User", foreign_keys=[target_user_id])
    target_post: Mapped[Post | None] = relationship("Post", foreign_keys=[target_post_id])
