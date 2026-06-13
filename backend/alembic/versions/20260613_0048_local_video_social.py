"""Local video social interactions (FEATURE-CREATORS-V2 / C2-S3-01).

Revision ID: 20260613_0048
Revises: 20260612_0047
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260613_0048"
down_revision: str | None = "20260612_0047"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "local_video_likes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("video_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["video_id"], ["local_videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "video_id", name="uq_local_video_likes_user_video"),
    )
    op.create_index("ix_local_video_likes_user_id", "local_video_likes", ["user_id"])
    op.create_index("ix_local_video_likes_video_id", "local_video_likes", ["video_id"])

    op.create_table(
        "local_video_comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("video_id", sa.Uuid(), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["video_id"], ["local_videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_local_video_comments_video_id", "local_video_comments", ["video_id"])
    op.create_index(
        "ix_local_video_comments_author_user_id",
        "local_video_comments",
        ["author_user_id"],
    )

    op.create_table(
        "local_video_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("video_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["video_id"], ["local_videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "video_id", name="uq_local_video_reports_user_video"),
    )
    op.create_index("ix_local_video_reports_user_id", "local_video_reports", ["user_id"])
    op.create_index("ix_local_video_reports_video_id", "local_video_reports", ["video_id"])


def downgrade() -> None:
    op.drop_index("ix_local_video_reports_video_id", table_name="local_video_reports")
    op.drop_index("ix_local_video_reports_user_id", table_name="local_video_reports")
    op.drop_table("local_video_reports")
    op.drop_index("ix_local_video_comments_author_user_id", table_name="local_video_comments")
    op.drop_index("ix_local_video_comments_video_id", table_name="local_video_comments")
    op.drop_table("local_video_comments")
    op.drop_index("ix_local_video_likes_video_id", table_name="local_video_likes")
    op.drop_index("ix_local_video_likes_user_id", table_name="local_video_likes")
    op.drop_table("local_video_likes")
