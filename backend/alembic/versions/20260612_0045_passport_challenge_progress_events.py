"""Passport challenge progress events (PASSPORT-04B).

Revision ID: 20260612_0045
Revises: 20260612_0044
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260612_0045"
down_revision: str | None = "20260612_0044"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "passport_challenge_progress_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_challenge_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("challenge_id", sa.Uuid(), nullable=False),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("metadata", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("amount > 0", name="ck_passport_challenge_progress_events_amount_positive"),
        sa.CheckConstraint(
            "source_type <> ''",
            name="ck_passport_challenge_progress_events_source_type_nonempty",
        ),
        sa.ForeignKeyConstraint(
            ["challenge_id"],
            ["passport_challenges.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_challenge_id"],
            ["user_passport_challenges.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_passport_challenge_progress_events_user_challenge",
        "passport_challenge_progress_events",
        ["user_challenge_id", "created_at"],
    )
    op.create_index(
        "uq_passport_challenge_progress_events_idempotent_source",
        "passport_challenge_progress_events",
        ["user_id", "challenge_id", "source_type", "source_id"],
        unique=True,
        postgresql_where=sa.text("source_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_passport_challenge_progress_events_idempotent_source",
        table_name="passport_challenge_progress_events",
    )
    op.drop_index(
        "idx_passport_challenge_progress_events_user_challenge",
        table_name="passport_challenge_progress_events",
    )
    op.drop_table("passport_challenge_progress_events")
