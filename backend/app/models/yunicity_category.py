"""Official Yunicity category catalog — staff-managed referential (PROD-DATA-05B)."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, CheckConstraint, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models._mixins import TimestampMixin


class YunicityCategory(TimestampMixin, Base):
    """Territorial category referential for partners, places and discovery."""

    __tablename__ = "yunicity_categories"
    __table_args__ = (
        CheckConstraint(
            "display_order >= 0",
            name="ck_yunicity_categories_display_order_nonneg",
        ),
        Index("ix_yunicity_categories_active_order", "is_active", "display_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(64), nullable=False)
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
