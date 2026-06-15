"""Yunicity official categories catalog (FEATURE-PROD-DATA-05 / 05B).

Revision ID: 20260614_0051
Revises: 20260613_0050
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260614_0051"
down_revision: str | None = "20260613_0050"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "yunicity_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
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
        sa.CheckConstraint("display_order >= 0", name="ck_yunicity_categories_display_order_nonneg"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_yunicity_categories_slug"),
    )
    op.create_index(
        "ix_yunicity_categories_active_order",
        "yunicity_categories",
        ["is_active", "display_order"],
    )


def downgrade() -> None:
    op.drop_index("ix_yunicity_categories_active_order", table_name="yunicity_categories")
    op.drop_table("yunicity_categories")
