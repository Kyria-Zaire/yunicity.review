"""Passport ORM — digital identity, stamps, partner offers, redemptions (TICKET-302)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.passport_constants import (
    DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT,
    OfferRedemptionStatus,
    PartnerOfferStatus,
    PartnerOfferType,
    PassportStampSource,
    PassportStatus,
    PassportTierCode,
)
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class PassportTier(TimestampMixin, Base):
    """Configurable tier catalog — visibility, order, flags (no pricing in MVP)."""

    __tablename__ = "passport_tiers"
    __table_args__ = (
        UniqueConstraint("code", name="uq_passport_tiers_code"),
        Index("ix_passport_tiers_display_order", "display_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    code: Mapped[PassportTierCode] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    is_publicly_visible: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    flags: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )

    passports: Mapped[list[Passport]] = relationship("Passport", back_populates="tier")


class Passport(TimestampMixin, Base):
    """
    Digital passport for a citizen — one active passport per user (MVP).

    Relations:
        User (owner) -> Passport
        Passport -> PassportStamp, PassportOfferRedemption
        PassportTier -> Passport
    """

    __tablename__ = "passports"
    __table_args__ = (
        UniqueConstraint("passport_number", name="uq_passports_passport_number"),
        UniqueConstraint("qr_token", name="uq_passports_qr_token"),
        Index(
            "uq_passports_one_active_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
        Index("ix_passports_user_id", "user_id"),
        Index("ix_passports_tier_id", "tier_id"),
        Index("ix_passports_city", "city"),
        Index("ix_passports_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    tier_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passport_tiers.id", ondelete="RESTRICT"), nullable=False
    )
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    passport_number: Mapped[str] = mapped_column(String(32), nullable=False)
    qr_token: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[PassportStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=PassportStatus.ACTIVE.value,
        default=PassportStatus.ACTIVE,
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    onboarding_step: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stamps_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    redemptions_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    last_stamp_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    user: Mapped[User] = relationship("User", back_populates="passports")
    tier: Mapped[PassportTier] = relationship("PassportTier", back_populates="passports")
    stamps: Mapped[list[PassportStamp]] = relationship(
        "PassportStamp",
        back_populates="passport",
        cascade="all, delete-orphan",
    )
    redemptions: Mapped[list[PassportOfferRedemption]] = relationship(
        "PassportOfferRedemption",
        back_populates="passport",
        cascade="all, delete-orphan",
    )


class PassportStamp(TimestampMixin, Base):
    """
    Stamp collected from a partner — MVP: organization visits only.

    Relations:
        Passport -> PassportStamp
        Organization -> PassportStamp
    """

    __tablename__ = "passport_stamps"
    __table_args__ = (
        UniqueConstraint(
            "passport_id",
            "organization_id",
            name="uq_passport_stamps_passport_organization",
        ),
        Index("ix_passport_stamps_passport_id", "passport_id"),
        Index("ix_passport_stamps_organization_id", "organization_id"),
        Index("ix_passport_stamps_stamped_at", "stamped_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    passport_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passports.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    stamp_source: Mapped[PassportStampSource] = mapped_column(
        String(32),
        nullable=False,
        server_default=PassportStampSource.ORGANIZATION.value,
        default=PassportStampSource.ORGANIZATION,
    )
    stamped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    stamped_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    passport: Mapped[Passport] = relationship("Passport", back_populates="stamps")
    organization: Mapped[Organization] = relationship(
        "Organization", back_populates="passport_stamps"
    )
    stamped_by_user: Mapped[User | None] = relationship("User")


class PartnerOffer(TimestampMixin, Base):
    """
    Partner benefit offer — must belong to a verified organization (enforced in services).

    Relations:
        Organization -> PartnerOffer
        PartnerOffer -> PassportOfferRedemption
    """

    __tablename__ = "partner_offers"
    __table_args__ = (
        CheckConstraint(
            "max_redemptions_per_passport >= 1",
            name="ck_partner_offers_max_redemptions_per_passport_positive",
        ),
        Index("ix_partner_offers_organization_id", "organization_id"),
        Index("ix_partner_offers_status", "status"),
        Index("ix_partner_offers_offer_type", "offer_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    offer_type: Mapped[PartnerOfferType] = mapped_column(String(32), nullable=False)
    status: Mapped[PartnerOfferStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=PartnerOfferStatus.DRAFT.value,
        default=PartnerOfferStatus.DRAFT,
        comment="Product offer_status (workflow source of truth).",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        comment="MVP compat flag — true when offer_status is published.",
    )
    tier_code_required: Mapped[str | None] = mapped_column(String(32), nullable=True)
    max_redemptions_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_redemptions_per_passport: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT,
        server_default=str(DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT),
    )
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_flash: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    flash_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    notification_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Reserved for future flash push (TICKET-501+).",
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    organization: Mapped[Organization] = relationship(
        "Organization", back_populates="partner_offers"
    )
    redemptions: Mapped[list[PassportOfferRedemption]] = relationship(
        "PassportOfferRedemption",
        back_populates="offer",
        cascade="all, delete-orphan",
    )
    created_by_user: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
    )
    moderated_by_user: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[moderated_by_user_id],
    )


class PassportOfferRedemption(TimestampMixin, Base):
    """
    Simple redemption tracking — one row per passport/offer (MVP).

    Relations:
        Passport -> PassportOfferRedemption
        PartnerOffer -> PassportOfferRedemption
    """

    __tablename__ = "passport_offer_redemptions"
    __table_args__ = (
        UniqueConstraint(
            "passport_id",
            "partner_offer_id",
            name="uq_passport_offer_redemptions_passport_offer",
        ),
        Index("ix_passport_offer_redemptions_passport_id", "passport_id"),
        Index("ix_passport_offer_redemptions_partner_offer_id", "partner_offer_id"),
        Index("ix_passport_offer_redemptions_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    passport_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passports.id", ondelete="CASCADE"), nullable=False
    )
    partner_offer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("partner_offers.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[OfferRedemptionStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=OfferRedemptionStatus.PENDING.value,
        default=OfferRedemptionStatus.PENDING,
    )
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    passport: Mapped[Passport] = relationship("Passport", back_populates="redemptions")
    offer: Mapped[PartnerOffer] = relationship("PartnerOffer", back_populates="redemptions")
