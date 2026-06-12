"""Passport V2 badge catalog (PASSPORT-03A).

Revision ID: 20260612_0043
Revises: 20260611_0042
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260612_0043"
down_revision: str | None = "20260611_0042"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "passport_badges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("family", sa.String(length=32), nullable=False),
        sa.Column("visibility", sa.String(length=32), nullable=False),
        sa.Column("rarity", sa.String(length=32), nullable=False),
        sa.Column("reputation_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ym_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
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
        sa.CheckConstraint("code <> ''", name="ck_passport_badges_code_nonempty"),
        sa.CheckConstraint(
            "family IN ('explorer', 'culture', 'citizen', 'prestige', 'creator', 'secret')",
            name="ck_passport_badges_family_valid",
        ),
        sa.CheckConstraint(
            "visibility IN ('visible', 'secret')",
            name="ck_passport_badges_visibility_valid",
        ),
        sa.CheckConstraint(
            "rarity IN ('common', 'rare', 'epic', 'legendary')",
            name="ck_passport_badges_rarity_valid",
        ),
        sa.CheckConstraint(
            "reputation_reward >= 0",
            name="ck_passport_badges_reputation_reward_nonneg",
        ),
        sa.CheckConstraint("ym_reward >= 0", name="ck_passport_badges_ym_reward_nonneg"),
        sa.CheckConstraint(
            "display_order >= 0",
            name="ck_passport_badges_display_order_nonneg",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_passport_badges_code", "passport_badges", ["code"], unique=True)
    op.create_index("idx_passport_badges_family", "passport_badges", ["family"])
    op.create_index("idx_passport_badges_visibility", "passport_badges", ["visibility"])
    op.create_index(
        "idx_passport_badges_active_order",
        "passport_badges",
        ["is_active", "display_order"],
    )

    op.create_table(
        "user_passport_badges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("badge_id", sa.Uuid(), nullable=False),
        sa.Column(
            "earned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("source_type", sa.String(length=64), nullable=True),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("metadata", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["badge_id"], ["passport_badges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_user_passport_badges_user_badge",
        "user_passport_badges",
        ["user_id", "badge_id"],
        unique=True,
    )
    op.create_index(
        "idx_user_passport_badges_user_earned_at",
        "user_passport_badges",
        ["user_id", "earned_at"],
    )
    op.create_index(
        "idx_user_passport_badges_badge_id",
        "user_passport_badges",
        ["badge_id"],
    )
    op.create_index(
        "idx_user_passport_badges_source",
        "user_passport_badges",
        ["source_type", "source_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_user_passport_badges_source", table_name="user_passport_badges")
    op.drop_index("idx_user_passport_badges_badge_id", table_name="user_passport_badges")
    op.drop_index(
        "idx_user_passport_badges_user_earned_at",
        table_name="user_passport_badges",
    )
    op.drop_index("uq_user_passport_badges_user_badge", table_name="user_passport_badges")
    op.drop_table("user_passport_badges")

    op.drop_index("idx_passport_badges_active_order", table_name="passport_badges")
    op.drop_index("idx_passport_badges_visibility", table_name="passport_badges")
    op.drop_index("idx_passport_badges_family", table_name="passport_badges")
    op.drop_index("uq_passport_badges_code", table_name="passport_badges")
    op.drop_table("passport_badges")
