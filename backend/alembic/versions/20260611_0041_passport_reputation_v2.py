"""Passport V2 reputation events + snapshots (PASSPORT-01A).

Revision ID: 20260611_0041
Revises: 20260608_0040
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260611_0041"
down_revision: str | None = "20260608_0040"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reputation_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("metadata", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("points > 0", name="ck_reputation_events_points_positive"),
        sa.CheckConstraint("event_type <> ''", name="ck_reputation_events_event_type_nonempty"),
        sa.CheckConstraint("source_type <> ''", name="ck_reputation_events_source_type_nonempty"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_reputation_events_user_created_at",
        "reputation_events",
        ["user_id", "created_at"],
    )
    op.create_index(
        "idx_reputation_events_source",
        "reputation_events",
        ["source_type", "source_id"],
    )
    op.create_index(
        "idx_reputation_events_event_type",
        "reputation_events",
        ["event_type"],
    )
    op.create_index(
        "uq_reputation_events_idempotent_source",
        "reputation_events",
        ["user_id", "event_type", "source_type", "source_id"],
        unique=True,
        postgresql_where=sa.text("source_id IS NOT NULL"),
    )

    op.create_table(
        "user_reputation_snapshots",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("total_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_event_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "total_points >= 0",
            name="ck_user_reputation_snapshots_total_nonneg",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(
        "idx_user_reputation_snapshots_total_points",
        "user_reputation_snapshots",
        ["total_points"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_user_reputation_snapshots_total_points",
        table_name="user_reputation_snapshots",
    )
    op.drop_table("user_reputation_snapshots")

    op.drop_index(
        "uq_reputation_events_idempotent_source",
        table_name="reputation_events",
    )
    op.drop_index("idx_reputation_events_event_type", table_name="reputation_events")
    op.drop_index("idx_reputation_events_source", table_name="reputation_events")
    op.drop_index("idx_reputation_events_user_created_at", table_name="reputation_events")
    op.drop_table("reputation_events")
