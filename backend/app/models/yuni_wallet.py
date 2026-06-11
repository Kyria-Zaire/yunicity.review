"""YuniMonnaie wallet ORM — ledger + balance (PASSPORT-02A)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.yuni_wallet_constants import YuniWalletStatus
from app.db.base import Base
from app.models._mixins import CreatedAtMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class YuniWallet(TimestampMixin, Base):
    """One wallet per user — territorial engagement currency, non-transferable."""

    __tablename__ = "yuni_wallets"
    __table_args__ = (
        CheckConstraint("balance >= 0", name="ck_yuni_wallets_balance_nonneg"),
        CheckConstraint("lifetime_earned >= 0", name="ck_yuni_wallets_lifetime_earned_nonneg"),
        CheckConstraint("lifetime_spent >= 0", name="ck_yuni_wallets_lifetime_spent_nonneg"),
        Index("uq_yuni_wallets_user_id", "user_id", unique=True),
        Index("idx_yuni_wallets_status", "status"),
        Index("idx_yuni_wallets_balance", "balance"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    lifetime_earned: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    lifetime_spent: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=YuniWalletStatus.ACTIVE.value,
        server_default=YuniWalletStatus.ACTIVE.value,
    )

    user: Mapped[User] = relationship("User")
    transactions: Mapped[list[YuniTransaction]] = relationship(
        "YuniTransaction",
        back_populates="wallet",
        cascade="all, delete-orphan",
    )


class YuniTransaction(CreatedAtMixin, Base):
    """Append-only YuniMonnaie ledger — never updated or deleted."""

    __tablename__ = "yuni_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_yuni_transactions_amount_positive"),
        CheckConstraint("balance_after >= 0", name="ck_yuni_transactions_balance_after_nonneg"),
        CheckConstraint(
            "transaction_type <> ''",
            name="ck_yuni_transactions_type_nonempty",
        ),
        CheckConstraint(
            "reference_type <> ''",
            name="ck_yuni_transactions_reference_type_nonempty",
        ),
        Index("idx_yuni_transactions_wallet_created_at", "wallet_id", "created_at"),
        Index("idx_yuni_transactions_user_created_at", "user_id", "created_at"),
        Index("idx_yuni_transactions_reference", "reference_type", "reference_id"),
        Index("idx_yuni_transactions_type", "transaction_type"),
        Index(
            "uq_yuni_transactions_idempotent_reference",
            "user_id",
            "transaction_type",
            "reference_type",
            "reference_id",
            unique=True,
            postgresql_where=text("reference_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("yuni_wallets.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    transaction_type: Mapped[str] = mapped_column(String(32), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    wallet: Mapped[YuniWallet] = relationship("YuniWallet", back_populates="transactions")
    user: Mapped[User] = relationship("User")
