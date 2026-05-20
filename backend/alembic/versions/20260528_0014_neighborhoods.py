"""Neighborhoods foundation (TICKET-602).

Revision ID: 20260528_0014
Revises: 20260527_0013
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260528_0014"
down_revision: str | None = "20260527_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "neighborhoods",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("ambiance", sa.String(length=32), nullable=True),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("accent_color", sa.String(length=16), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("radius_meters", sa.Integer(), nullable=True),
        sa.Column(
            "is_featured",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("city", "slug", name="uq_neighborhoods_city_slug"),
    )
    op.create_index("ix_neighborhoods_city_active", "neighborhoods", ["city", "is_active"])
    op.create_index("ix_neighborhoods_city_featured", "neighborhoods", ["city", "is_featured"])

    for table in ("local_events", "partner_offers", "organizations", "posts"):
        op.add_column(
            table,
            sa.Column("neighborhood_id", sa.Uuid(), nullable=True),
        )
        op.create_foreign_key(
            f"fk_{table}_neighborhood_id",
            table,
            "neighborhoods",
            ["neighborhood_id"],
            ["id"],
            ondelete="SET NULL",
        )
        op.create_index(f"ix_{table}_neighborhood_id", table, ["neighborhood_id"])


def downgrade() -> None:
    for table in ("posts", "organizations", "partner_offers", "local_events"):
        op.drop_index(f"ix_{table}_neighborhood_id", table_name=table)
        op.drop_constraint(f"fk_{table}_neighborhood_id", table, type_="foreignkey")
        op.drop_column(table, "neighborhood_id")

    op.drop_index("ix_neighborhoods_city_featured", table_name="neighborhoods")
    op.drop_index("ix_neighborhoods_city_active", table_name="neighborhoods")
    op.drop_table("neighborhoods")
