"""Partner creator content ORM (WEB-PARTNERS-06A)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.post import Post
    from app.models.user import User


class PartnerCreatorContent(TimestampMixin, Base):
    """
    Editorial content published by a verified partner organization.

    Feed linkage is optional until publication sync (WEB-PARTNERS-06C).
    """

    __tablename__ = "partner_creator_contents"
    __table_args__ = (
        Index("ix_partner_creator_contents_organization_id", "organization_id"),
        Index("ix_partner_creator_contents_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[PartnerCreatorContentStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=PartnerCreatorContentStatus.DRAFT.value,
        default=PartnerCreatorContentStatus.DRAFT,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    moderated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="partner_creator_contents",
    )
    created_by: Mapped[User | None] = relationship("User", foreign_keys=[created_by_user_id])
    moderated_by: Mapped[User | None] = relationship("User", foreign_keys=[moderated_by_user_id])
    post: Mapped[Post | None] = relationship(
        "Post",
        back_populates="partner_creator_content",
        foreign_keys="Post.partner_creator_content_id",
        uselist=False,
    )
