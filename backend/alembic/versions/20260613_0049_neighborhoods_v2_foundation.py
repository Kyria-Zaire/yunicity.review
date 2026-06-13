"""Quartiers V2 foundation (FEATURE-QUARTIERS-V2 / Q2-S1-01).

Revision ID: 20260613_0049
Revises: 20260613_0048
"""
# ruff: noqa: E501

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260613_0049"
down_revision: str | None = "20260613_0048"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("neighborhoods", sa.Column("long_story", sa.Text(), nullable=True))
    op.add_column("neighborhoods", sa.Column("why_locals_love", sa.Text(), nullable=True))
    op.add_column(
        "neighborhoods",
        sa.Column("featured_quote", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "neighborhoods",
        sa.Column("official_label", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "neighborhoods",
        sa.Column("hero_image_storage_key", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "neighborhoods",
        sa.Column("editorial_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("neighborhoods", sa.Column("editorial_updated_by", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_neighborhoods_editorial_updated_by_users",
        "neighborhoods",
        "users",
        ["editorial_updated_by"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "neighborhood_aliases",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("alias", sa.String(length=120), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
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
        sa.ForeignKeyConstraint(
            ["neighborhood_id"],
            ["neighborhoods.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_neighborhood_aliases_neighborhood_id",
        "neighborhood_aliases",
        ["neighborhood_id"],
    )

    op.create_table(
        "neighborhood_mood_tags",
        sa.Column("slug", sa.String(length=32), nullable=False),
        sa.Column("label", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("slug"),
    )

    op.create_table(
        "neighborhood_mood_assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("mood_slug", sa.String(length=32), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
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
        sa.ForeignKeyConstraint(
            ["mood_slug"],
            ["neighborhood_mood_tags.slug"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["neighborhood_id"],
            ["neighborhoods.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "neighborhood_id",
            "mood_slug",
            name="uq_neighborhood_mood_assignments_hood_mood",
        ),
    )
    op.create_index(
        "ix_neighborhood_mood_assignments_neighborhood_id",
        "neighborhood_mood_assignments",
        ["neighborhood_id"],
    )

    op.create_table(
        "neighborhood_timeline_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
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
        sa.ForeignKeyConstraint(
            ["neighborhood_id"],
            ["neighborhoods.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_neighborhood_timeline_entries_hood_year",
        "neighborhood_timeline_entries",
        ["neighborhood_id", "year", "sort_order"],
    )

    op.create_table(
        "neighborhood_contributions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.Uuid(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["author_user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["neighborhood_id"],
            ["neighborhoods.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_neighborhood_contributions_hood_status",
        "neighborhood_contributions",
        ["neighborhood_id", "status"],
    )
    op.create_index(
        "ix_neighborhood_contributions_status_created",
        "neighborhood_contributions",
        ["status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_neighborhood_contributions_status_created", table_name="neighborhood_contributions")
    op.drop_index("ix_neighborhood_contributions_hood_status", table_name="neighborhood_contributions")
    op.drop_table("neighborhood_contributions")

    op.drop_index(
        "ix_neighborhood_timeline_entries_hood_year",
        table_name="neighborhood_timeline_entries",
    )
    op.drop_table("neighborhood_timeline_entries")

    op.drop_index(
        "ix_neighborhood_mood_assignments_neighborhood_id",
        table_name="neighborhood_mood_assignments",
    )
    op.drop_table("neighborhood_mood_assignments")
    op.drop_table("neighborhood_mood_tags")

    op.drop_index("ix_neighborhood_aliases_neighborhood_id", table_name="neighborhood_aliases")
    op.drop_table("neighborhood_aliases")

    op.execute(
        sa.text(
            "ALTER TABLE neighborhoods DROP CONSTRAINT IF EXISTS "
            "fk_neighborhoods_editorial_updated_by_users"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE neighborhoods DROP CONSTRAINT IF EXISTS "
            "neighborhoods_editorial_updated_by_fkey"
        )
    )
    op.drop_column("neighborhoods", "editorial_updated_by")
    op.drop_column("neighborhoods", "editorial_updated_at")
    op.drop_column("neighborhoods", "hero_image_storage_key")
    op.drop_column("neighborhoods", "official_label")
    op.drop_column("neighborhoods", "featured_quote")
    op.drop_column("neighborhoods", "why_locals_love")
    op.drop_column("neighborhoods", "long_story")
