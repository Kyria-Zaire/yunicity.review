"""Signed partner profile linked to organizations (WEB-PARTNERS-01)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.partner_constants import PartnershipType, PartnerStatus
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class PartnerProfile(TimestampMixin, Base):
    __tablename__ = "partner_profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    partner_status: Mapped[PartnerStatus] = mapped_column(
        String(32), nullable=False, index=True
    )
    partnership_type: Mapped[PartnershipType] = mapped_column(
        String(32), nullable=False, index=True
    )
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    contract_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    public_partner_label: Mapped[str | None] = mapped_column(String(160), nullable=True)
    is_featured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    featured_priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    notes_internal: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="partner_profile",
    )
