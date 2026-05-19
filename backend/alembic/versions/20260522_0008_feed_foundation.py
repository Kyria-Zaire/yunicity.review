"""feed foundation (TICKET-402)

Revision ID: 20260522_0008
Revises: 20260521_0007
Create Date: 2026-05-22

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260522_0008"
down_revision: str | None = "20260521_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_type", sa.String(length=20), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("type", sa.String(length=20), server_default="post", nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("media_url", sa.String(length=500), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("like_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("comment_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("partner_offer_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["partner_offer_id"], ["partner_offers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("partner_offer_id", name="uq_posts_partner_offer_id"),
    )
    op.create_index("ix_posts_city_created_at", "posts", ["city", "created_at"])
    op.create_index("ix_posts_author", "posts", ["author_type", "author_id"])
    op.create_index("ix_posts_is_active_created_at", "posts", ["is_active", "created_at"])
    op.create_index("ix_posts_city", "posts", ["city"])

    op.execute(
        "ALTER TABLE posts ADD COLUMN location geography(Point, 4326)"
    )

    op.create_table(
        "likes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "post_id", name="uq_likes_user_post"),
    )
    op.create_index("ix_likes_user_id", "likes", ["user_id"])
    op.create_index("ix_likes_post_id", "likes", ["post_id"])

    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_post_id", "comments", ["post_id"])

    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_user_id", "reports", ["user_id"])
    op.create_index("ix_reports_post_id", "reports", ["post_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("comments")
    op.drop_table("likes")
    op.drop_table("posts")
