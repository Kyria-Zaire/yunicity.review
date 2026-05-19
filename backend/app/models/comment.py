"""Post comment ORM (TICKET-402)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.post import Post
    from app.models.user import User


class Comment(TimestampMixin, Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship("User")
    post: Mapped[Post] = relationship("Post", back_populates="comments")

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
