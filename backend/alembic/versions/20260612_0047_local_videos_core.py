"""Local videos core tables (FEATURE-CREATORS-V2 / C2-S1).

Revision ID: 20260612_0047
Revises: 20260612_0046
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260612_0047"
down_revision: str | None = "20260612_0046"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "local_video_uploads",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=64), nullable=False),
        sa.Column("expected_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
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
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_local_video_uploads_author_created",
        "local_video_uploads",
        ["author_user_id", "created_at"],
    )
    op.create_index(
        "ix_local_video_uploads_status_expires",
        "local_video_uploads",
        ["status", "expires_at"],
    )

    op.create_table(
        "local_videos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=False),
        sa.Column("upload_id", sa.Uuid(), nullable=True),
        sa.Column("city", sa.String(length=64), nullable=False),
        sa.Column("neighborhood_id", sa.Uuid(), nullable=False),
        sa.Column("video_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=80), nullable=True),
        sa.Column("description", sa.String(length=300), nullable=True),
        sa.Column("cultural_place_id", sa.Uuid(), nullable=True),
        sa.Column("local_event_id", sa.Uuid(), nullable=True),
        sa.Column("tribe_id", sa.Uuid(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("media_url", sa.String(length=1024), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=1024), nullable=False),
        sa.Column("duration_seconds", sa.Numeric(8, 2), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(length=64), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="processing"),
        sa.Column("processing_error", sa.Text(), nullable=True),
        sa.Column("report_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("review_priority", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["upload_id"], ["local_video_uploads.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["neighborhood_id"], ["neighborhoods.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["cultural_place_id"], ["cultural_places.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["local_event_id"], ["local_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tribe_id"], ["tribes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_local_videos_city_status_published",
        "local_videos",
        ["city", "status", "published_at"],
    )
    op.create_index(
        "ix_local_videos_neighborhood_status",
        "local_videos",
        ["neighborhood_id", "status"],
    )
    op.create_index(
        "ix_local_videos_author_created",
        "local_videos",
        ["author_user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_local_videos_author_created", table_name="local_videos")
    op.drop_index("ix_local_videos_neighborhood_status", table_name="local_videos")
    op.drop_index("ix_local_videos_city_status_published", table_name="local_videos")
    op.drop_table("local_videos")
    op.drop_index("ix_local_video_uploads_status_expires", table_name="local_video_uploads")
    op.drop_index("ix_local_video_uploads_author_created", table_name="local_video_uploads")
    op.drop_table("local_video_uploads")
