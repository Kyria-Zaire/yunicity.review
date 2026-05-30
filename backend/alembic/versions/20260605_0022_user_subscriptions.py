"""User paid memberships (WEB-SUBSCRIPTIONS-01).

Revision ID: 20260605_0022
Revises: 20260604_0021
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0022"
down_revision: str | None = "20260604_0021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("plan_code", sa.String(length=32), nullable=False),
        sa.Column("billing_interval", sa.String(length=16), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_subscriptions_user_id"),
    )
    op.create_index("ix_user_subscriptions_user_id", "user_subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_subscriptions_user_id", table_name="user_subscriptions")
    op.drop_table("user_subscriptions")
