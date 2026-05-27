"""Cultural places media infrastructure (WEB-SEARCH-02B.1).

Revision ID: 20260604_0021
Revises: 20260603_0020
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260604_0021"
down_revision: str | None = "20260603_0020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "cultural_places",
        sa.Column("hero_image_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("gallery_images", sa.JSON(), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("thumbnail_image_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("photo_credit", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("image_source", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("editorial_excerpt", sa.Text(), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column("image_blurhash", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "cultural_places",
        sa.Column(
            "featured_priority",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.create_index(
        "ix_cultural_places_city_featured_priority",
        "cultural_places",
        ["city", "featured_priority"],
    )

    # Backfill legacy image_url into hero when present.
    op.execute(
        """
        UPDATE cultural_places
        SET hero_image_url = image_url,
            thumbnail_image_url = image_url
        WHERE image_url IS NOT NULL
          AND hero_image_url IS NULL
        """
    )
    op.execute(
        """
        UPDATE cultural_places
        SET photo_credit = image_credit
        WHERE image_credit IS NOT NULL
          AND photo_credit IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_cultural_places_city_featured_priority", table_name="cultural_places")
    op.drop_column("cultural_places", "featured_priority")
    op.drop_column("cultural_places", "image_blurhash")
    op.drop_column("cultural_places", "editorial_excerpt")
    op.drop_column("cultural_places", "image_source")
    op.drop_column("cultural_places", "photo_credit")
    op.drop_column("cultural_places", "thumbnail_image_url")
    op.drop_column("cultural_places", "gallery_images")
    op.drop_column("cultural_places", "hero_image_url")
