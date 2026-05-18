"""Partner lead CRM entities — acquisition pipeline before verified organizations."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.partner_lead_constants import PartnerLeadSource, PartnerLeadStatus
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class PartnerLead(TimestampMixin, Base):
    __tablename__ = "partner_leads"
    __table_args__ = (
        CheckConstraint(
            "internal_rating IS NULL OR (internal_rating >= 1 AND internal_rating <= 5)",
            name="ck_partner_leads_internal_rating_range",
        ),
        CheckConstraint(
            "char_length(coalesce(notes, '')) <= 5000",
            name="ck_partner_leads_notes_length",
        ),
        UniqueConstraint(
            "name_normalized",
            "city_normalized",
            "phone_normalized",
            name="uq_partner_leads_name_city_phone",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    organization_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    website: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    instagram: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    source: Mapped[PartnerLeadSource] = mapped_column(
        String(32),
        nullable=False,
        server_default=PartnerLeadSource.PHYSICAL_PROSPECTING.value,
        index=True,
    )
    status: Mapped[PartnerLeadStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=PartnerLeadStatus.NEW.value,
        index=True,
    )

    interested_passport: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    interested_events: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    interested_creator_program: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    interested_offers: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    interested_business_passport: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    tags: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_followup_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    converted_organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default="{}",
    )

    name_normalized: Mapped[str] = mapped_column(String(160), nullable=False)
    city_normalized: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    phone_normalized: Mapped[str] = mapped_column(String(32), nullable=False, default="")

    converted_organization: Mapped[Organization | None] = relationship(
        "Organization", foreign_keys=[converted_organization_id]
    )
    converted_by: Mapped[User | None] = relationship("User", foreign_keys=[converted_by_user_id])
    created_by: Mapped[User | None] = relationship("User", foreign_keys=[created_by_user_id])
    updated_by: Mapped[User | None] = relationship("User", foreign_keys=[updated_by_user_id])

    @staticmethod
    def normalize_identity_key(
        *,
        name: str,
        city: str | None,
        phone: str | None,
    ) -> tuple[str, str, str]:
        return (
            name.strip().lower(),
            (city or "").strip().lower(),
            (phone or "").strip().lower(),
        )
