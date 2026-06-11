"""YuniMonnaie wallet ledger (PASSPORT-02A).

Revision ID: 20260611_0042
Revises: 20260611_0041
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260611_0042"
down_revision: str | None = "20260611_0041"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "yuni_wallets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("balance", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lifetime_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lifetime_spent", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="active",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("balance >= 0", name="ck_yuni_wallets_balance_nonneg"),
        sa.CheckConstraint(
            "lifetime_earned >= 0",
            name="ck_yuni_wallets_lifetime_earned_nonneg",
        ),
        sa.CheckConstraint(
            "lifetime_spent >= 0",
            name="ck_yuni_wallets_lifetime_spent_nonneg",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_yuni_wallets_user_id", "yuni_wallets", ["user_id"], unique=True)
    op.create_index("idx_yuni_wallets_status", "yuni_wallets", ["status"])
    op.create_index("idx_yuni_wallets_balance", "yuni_wallets", ["balance"])

    op.create_table(
        "yuni_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("wallet_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_type", sa.String(length=32), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("reference_type", sa.String(length=64), nullable=False),
        sa.Column("reference_id", sa.Uuid(), nullable=True),
        sa.Column("metadata", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("amount > 0", name="ck_yuni_transactions_amount_positive"),
        sa.CheckConstraint(
            "balance_after >= 0",
            name="ck_yuni_transactions_balance_after_nonneg",
        ),
        sa.CheckConstraint(
            "transaction_type <> ''",
            name="ck_yuni_transactions_type_nonempty",
        ),
        sa.CheckConstraint(
            "reference_type <> ''",
            name="ck_yuni_transactions_reference_type_nonempty",
        ),
        sa.ForeignKeyConstraint(["wallet_id"], ["yuni_wallets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_yuni_transactions_wallet_created_at",
        "yuni_transactions",
        ["wallet_id", "created_at"],
    )
    op.create_index(
        "idx_yuni_transactions_user_created_at",
        "yuni_transactions",
        ["user_id", "created_at"],
    )
    op.create_index(
        "idx_yuni_transactions_reference",
        "yuni_transactions",
        ["reference_type", "reference_id"],
    )
    op.create_index(
        "idx_yuni_transactions_type",
        "yuni_transactions",
        ["transaction_type"],
    )
    op.create_index(
        "uq_yuni_transactions_idempotent_reference",
        "yuni_transactions",
        ["user_id", "transaction_type", "reference_type", "reference_id"],
        unique=True,
        postgresql_where=sa.text("reference_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_yuni_transactions_idempotent_reference",
        table_name="yuni_transactions",
    )
    op.drop_index("idx_yuni_transactions_type", table_name="yuni_transactions")
    op.drop_index("idx_yuni_transactions_reference", table_name="yuni_transactions")
    op.drop_index(
        "idx_yuni_transactions_user_created_at",
        table_name="yuni_transactions",
    )
    op.drop_index(
        "idx_yuni_transactions_wallet_created_at",
        table_name="yuni_transactions",
    )
    op.drop_table("yuni_transactions")

    op.drop_index("idx_yuni_wallets_balance", table_name="yuni_wallets")
    op.drop_index("idx_yuni_wallets_status", table_name="yuni_wallets")
    op.drop_index("uq_yuni_wallets_user_id", table_name="yuni_wallets")
    op.drop_table("yuni_wallets")
