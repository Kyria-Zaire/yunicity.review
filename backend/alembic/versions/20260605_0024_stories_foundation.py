"""Local stories portal (WEB-STORIES-01).

Revision ID: 20260605_0024
Revises: 20260605_0023
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0024"
down_revision: str | None = "20260605_0023"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column("is_story", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "posts",
        sa.Column("story_category", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "posts",
        sa.Column("story_location_label", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "posts",
        sa.Column("story_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "posts",
        sa.Column("view_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_posts_is_story_expires", "posts", ["is_story", "story_expires_at"])


def downgrade() -> None:
    op.drop_index("ix_posts_is_story_expires", table_name="posts")
    op.drop_column("posts", "view_count")
    op.drop_column("posts", "story_expires_at")
    op.drop_column("posts", "story_location_label")
    op.drop_column("posts", "story_category")
    op.drop_column("posts", "is_story")
