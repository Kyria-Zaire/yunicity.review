"""posts composer metadata (FEED-POST-COMPOSER-01)

Revision ID: 20260704_0053
Revises: 20260614_0052
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260704_0053"
down_revision: str | None = "20260614_0052"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("posts")}

    if "post_visibility" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "post_visibility",
                sa.String(length=24),
                nullable=False,
                server_default="public",
            ),
        )
    if "post_format" not in columns:
        op.add_column("posts", sa.Column("post_format", sa.String(length=16), nullable=True))
    if "media_urls" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "media_urls",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        )
    if "allow_comments" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "allow_comments",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            ),
        )
    if "allow_shares" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "allow_shares",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            ),
        )
    if "scheduled_at" not in columns:
        op.add_column("posts", sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True))
    if "location_label" not in columns:
        op.add_column("posts", sa.Column("location_label", sa.String(length=120), nullable=True))
    if "activity_label" not in columns:
        op.add_column("posts", sa.Column("activity_label", sa.String(length=120), nullable=True))
    if "poll_data" not in columns:
        op.add_column(
            "posts",
            sa.Column("poll_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )
    if "tagged_user_ids" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "tagged_user_ids",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        )
    if "audience_user_ids" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "audience_user_ids",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        )
    if "cross_post_targets" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "cross_post_targets",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'{}'::jsonb"),
            ),
        )
    if "use_media_caption" not in columns:
        op.add_column(
            "posts",
            sa.Column(
                "use_media_caption",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )

    existing_indexes = {index["name"] for index in inspector.get_indexes("posts")}
    if "ix_posts_scheduled_at" not in existing_indexes:
        op.create_index("ix_posts_scheduled_at", "posts", ["scheduled_at"])


def downgrade() -> None:
    op.drop_index("ix_posts_scheduled_at", table_name="posts")
    for column in (
        "use_media_caption",
        "cross_post_targets",
        "audience_user_ids",
        "tagged_user_ids",
        "poll_data",
        "activity_label",
        "location_label",
        "scheduled_at",
        "allow_shares",
        "allow_comments",
        "media_urls",
        "post_format",
        "post_visibility",
    ):
        op.drop_column("posts", column)
