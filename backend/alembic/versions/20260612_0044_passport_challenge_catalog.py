"""Passport V2 challenge catalog (PASSPORT-04A).

Revision ID: 20260612_0044
Revises: 20260612_0043
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260612_0044"
down_revision: str | None = "20260612_0043"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "passport_challenges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("family", sa.String(length=32), nullable=False),
        sa.Column("rarity", sa.String(length=32), nullable=False),
        sa.Column("challenge_type", sa.String(length=32), nullable=False),
        sa.Column("target_value", sa.Integer(), nullable=False),
        sa.Column("ym_reward", sa.Integer(), server_default="0", nullable=False),
        sa.Column("badge_code", sa.String(length=64), nullable=True),
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
        sa.CheckConstraint("code <> ''", name="ck_passport_challenges_code_nonempty"),
        sa.CheckConstraint(
            "family IN ('explorer', 'citizen', 'culture', 'prestige')",
            name="ck_passport_challenges_family_valid",
        ),
        sa.CheckConstraint(
            "rarity IN ('common', 'rare', 'epic', 'legendary')",
            name="ck_passport_challenges_rarity_valid",
        ),
        sa.CheckConstraint(
            "challenge_type IN ('stamps', 'redemptions', 'events', 'manual')",
            name="ck_passport_challenges_type_valid",
        ),
        sa.CheckConstraint("target_value > 0", name="ck_passport_challenges_target_positive"),
        sa.CheckConstraint("ym_reward >= 0", name="ck_passport_challenges_ym_reward_nonneg"),
        sa.CheckConstraint(
            "display_order >= 0",
            name="ck_passport_challenges_display_order_nonneg",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_passport_challenges_code",
        "passport_challenges",
        ["code"],
        unique=True,
    )
    op.create_index("idx_passport_challenges_family", "passport_challenges", ["family"])
    op.create_index(
        "idx_passport_challenges_active_order",
        "passport_challenges",
        ["is_active", "display_order"],
    )

    op.create_table(
        "user_passport_challenges",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("challenge_id", sa.Uuid(), nullable=False),
        sa.Column("progress", sa.Integer(), server_default="0", nullable=False),
        sa.Column("target_value", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reward_claimed", sa.Boolean(), server_default="false", nullable=False),
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
        sa.CheckConstraint(
            "progress >= 0",
            name="ck_user_passport_challenges_progress_nonneg",
        ),
        sa.CheckConstraint(
            "target_value > 0",
            name="ck_user_passport_challenges_target_positive",
        ),
        sa.ForeignKeyConstraint(["challenge_id"], ["passport_challenges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_user_passport_challenges_user_challenge",
        "user_passport_challenges",
        ["user_id", "challenge_id"],
        unique=True,
    )
    op.create_index(
        "idx_user_passport_challenges_user",
        "user_passport_challenges",
        ["user_id"],
    )
    op.create_index(
        "idx_user_passport_challenges_completed",
        "user_passport_challenges",
        ["completed"],
    )
    op.create_index(
        "idx_user_passport_challenges_reward_claimed",
        "user_passport_challenges",
        ["reward_claimed"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_user_passport_challenges_reward_claimed",
        table_name="user_passport_challenges",
    )
    op.drop_index(
        "idx_user_passport_challenges_completed",
        table_name="user_passport_challenges",
    )
    op.drop_index(
        "idx_user_passport_challenges_user",
        table_name="user_passport_challenges",
    )
    op.drop_index(
        "uq_user_passport_challenges_user_challenge",
        table_name="user_passport_challenges",
    )
    op.drop_table("user_passport_challenges")

    op.drop_index("idx_passport_challenges_active_order", table_name="passport_challenges")
    op.drop_index("idx_passport_challenges_family", table_name="passport_challenges")
    op.drop_index("uq_passport_challenges_code", table_name="passport_challenges")
    op.drop_table("passport_challenges")
