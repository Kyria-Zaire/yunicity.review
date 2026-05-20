"""Local organization entities — commerce, associations, schools, etc."""

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
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationMethod,
    VerificationStatus,
)
from app.db.base import Base
from app.models._mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood
    from app.models.passport import PartnerOffer, PassportStamp
    from app.models.user import User


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"
    __table_args__ = (
        CheckConstraint(
            "latitude IS NULL OR (latitude >= -90 AND latitude <= 90)",
            name="ck_organizations_latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR (longitude >= -180 AND longitude <= 180)",
            name="ck_organizations_longitude_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[OrganizationType] = mapped_column(
        "type",
        String(32),
        nullable=False,
        index=True,
    )
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    country: Mapped[str] = mapped_column(
        String(2), nullable=False, server_default="FR", default="FR"
    )
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    website: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    social_links: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    logo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        String(32),
        nullable=False,
        server_default=VerificationStatus.PENDING.value,
        index=True,
    )
    verification_method: Mapped[VerificationMethod | None] = mapped_column(
        String(32), nullable=True
    )
    visibility: Mapped[OrganizationVisibility] = mapped_column(
        String(16),
        nullable=False,
        server_default=OrganizationVisibility.PRIVATE.value,
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    onboarding_step: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_claimable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    verified_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    neighborhood_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    members: Mapped[list[OrganizationMember]] = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    verifications: Mapped[list[OrganizationVerification]] = relationship(
        "OrganizationVerification",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    neighborhood: Mapped[Neighborhood | None] = relationship(
        "Neighborhood", back_populates="organizations"
    )
    created_by: Mapped[User | None] = relationship("User", foreign_keys=[created_by_user_id])
    verified_by: Mapped[User | None] = relationship("User", foreign_keys=[verified_by_user_id])
    passport_stamps: Mapped[list[PassportStamp]] = relationship(
        "PassportStamp",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    partner_offers: Mapped[list[PartnerOffer]] = relationship(
        "PartnerOffer",
        back_populates="organization",
        cascade="all, delete-orphan",
    )


class OrganizationMember(TimestampMixin, Base):
    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "user_id",
            name="uq_organization_members_org_user",
        ),
        Index(
            "uq_organization_members_one_active_owner",
            "organization_id",
            unique=True,
            postgresql_where="role = 'owner' AND status = 'active'",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[OrganizationMemberRole] = mapped_column(String(16), nullable=False, index=True)
    status: Mapped[OrganizationMemberStatus] = mapped_column(
        String(16),
        nullable=False,
        server_default=OrganizationMemberStatus.ACTIVE.value,
    )
    invited_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped[Organization] = relationship("Organization", back_populates="members")
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])
    invited_by: Mapped[User | None] = relationship("User", foreign_keys=[invited_by_user_id])


class OrganizationVerification(Base):
    __tablename__ = "organization_verifications"
    __table_args__ = (
        Index("ix_organization_verifications_organization_id", "organization_id"),
        Index("ix_organization_verifications_reviewed_by_user_id", "reviewed_by_user_id"),
        Index("ix_organization_verifications_new_status", "new_status"),
        Index("ix_organization_verifications_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    previous_status: Mapped[VerificationStatus | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[VerificationStatus] = mapped_column(String(32), nullable=False)
    method: Mapped[VerificationMethod | None] = mapped_column(String(32), nullable=True)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default="{}",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default="now()",
        nullable=False,
    )

    organization: Mapped[Organization] = relationship(
        "Organization", back_populates="verifications"
    )
    reviewed_by: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by_user_id])
