"""Territorial memory stamps — definitions & citizen souvenirs (TICKET-504)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.passport import PartnerOffer
    from app.models.user import User


class StampDefinition(TimestampMixin, Base):
    """Catalogue extensible de tampons locaux (slug, trigger, icône)."""

    __tablename__ = "stamp_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(32), nullable=False, server_default="seal")
    trigger_type: Mapped[str] = mapped_column(String(64), nullable=False)
    city_scoped: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    citizen_stamps: Mapped[list[CitizenLocalStamp]] = relationship(
        "CitizenLocalStamp",
        back_populates="definition",
    )


class CitizenLocalStamp(TimestampMixin, Base):
    """Souvenir territorial d'un citoyen — distinct des visites passport_stamps."""

    __tablename__ = "citizen_local_stamps"
    __table_args__ = (
        Index("ix_citizen_local_stamps_user_earned", "user_id", "earned_at"),
        Index(
            "uq_citizen_local_stamps_user_def_org",
            "user_id",
            "stamp_definition_id",
            "organization_id",
            unique=True,
            postgresql_where=text("organization_id IS NOT NULL"),
        ),
        Index(
            "uq_citizen_local_stamps_user_def_global",
            "user_id",
            "stamp_definition_id",
            unique=True,
            postgresql_where=text("organization_id IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    stamp_definition_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("stamp_definitions.id", ondelete="RESTRICT"), nullable=False
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    partner_offer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("partner_offers.id", ondelete="SET NULL"), nullable=True
    )
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    user: Mapped[User] = relationship("User")
    definition: Mapped[StampDefinition] = relationship(
        "StampDefinition",
        back_populates="citizen_stamps",
    )
    organization: Mapped[Organization | None] = relationship("Organization")
    partner_offer: Mapped[PartnerOffer | None] = relationship("PartnerOffer")
