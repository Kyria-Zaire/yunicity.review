"""Story media upload (WEB-STORIES-02).

Revision ID: 20260605_0025
Revises: 20260605_0024
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0025"
down_revision: str | None = "20260605_0024"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column(
            "story_audience",
            sa.String(length=24),
            nullable=False,
            server_default="public",
        ),
    )
    op.add_column(
        "posts",
        sa.Column(
            "story_tags",
            sa.dialects.postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "posts",
        sa.Column("story_media_type", sa.String(length=16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("posts", "story_media_type")
    op.drop_column("posts", "story_tags")
    op.drop_column("posts", "story_audience")
