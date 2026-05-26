"""Cultural places catalog (WEB-MAP-03).

Revision ID: 20260603_0020
Revises: 20260602_0019
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260603_0020"
down_revision: str | None = "20260602_0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cultural_places",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("image_alt", sa.String(length=255), nullable=True),
        sa.Column("source_name", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("image_credit", sa.String(length=255), nullable=True),
        sa.Column("image_license", sa.String(length=128), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.ForeignKeyConstraint(["neighborhood_id"], ["neighborhoods.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("city", "slug", name="uq_cultural_places_city_slug"),
    )
    op.create_index("ix_cultural_places_city_active", "cultural_places", ["city", "is_active"])
    op.create_index(
        "ix_cultural_places_city_featured",
        "cultural_places",
        ["city", "is_featured"],
    )
    op.create_index("ix_cultural_places_lat_lon", "cultural_places", ["latitude", "longitude"])


def downgrade() -> None:
    op.drop_index("ix_cultural_places_lat_lon", table_name="cultural_places")
    op.drop_index("ix_cultural_places_city_featured", table_name="cultural_places")
    op.drop_index("ix_cultural_places_city_active", table_name="cultural_places")
    op.drop_table("cultural_places")
