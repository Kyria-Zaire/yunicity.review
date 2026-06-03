"""Activation wave planning ORM (ADMIN-02C)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.activation_wave_constants import (
    ActivationWaveItemStatus,
    ActivationWaveStatus,
    default_activation_checklist,
)
from app.db.base import Base
from app.models._mixins import TimestampMixin


class ActivationWave(TimestampMixin, Base):
    __tablename__ = "activation_waves"
    __table_args__ = (
        UniqueConstraint("city", "code", name="uq_activation_waves_city_code"),
        Index("ix_activation_waves_city", "city"),
        Index("ix_activation_waves_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    city: Mapped[str] = mapped_column(String(64), nullable=False, default="Reims")
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ActivationWaveStatus] = mapped_column(
        String(32),
        nullable=False,
        default=ActivationWaveStatus.DRAFT,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    items: Mapped[list[ActivationWaveItem]] = relationship(
        "ActivationWaveItem",
        back_populates="wave",
        cascade="all, delete-orphan",
    )


class ActivationWaveItem(TimestampMixin, Base):
    __tablename__ = "activation_wave_items"
    __table_args__ = (
        UniqueConstraint(
            "wave_id",
            "partner_name_snapshot",
            name="uq_activation_wave_items_wave_name",
        ),
        Index("ix_activation_wave_items_wave_id", "wave_id"),
        Index("ix_activation_wave_items_organization_id", "organization_id"),
        Index("ix_activation_wave_items_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    wave_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("activation_waves.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    partner_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("partner_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    partner_name_snapshot: Mapped[str] = mapped_column(String(160), nullable=False)
    partner_slug_snapshot: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[ActivationWaveItemStatus] = mapped_column(
        String(32),
        nullable=False,
        default=ActivationWaveItemStatus.CANDIDATE,
    )
    checklist: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=default_activation_checklist,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    wave: Mapped[ActivationWave] = relationship("ActivationWave", back_populates="items")
