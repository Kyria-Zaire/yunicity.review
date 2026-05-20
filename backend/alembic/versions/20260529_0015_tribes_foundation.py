"""Tribes foundation (TICKET-A.2).

Revision ID: 20260529_0015
Revises: 20260528_0014
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260529_0015"
down_revision: str | None = "20260528_0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tribes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("visibility", sa.String(length=24), nullable=False),
        sa.Column(
            "persistence_kind",
            sa.String(length=24),
            nullable=False,
            server_default="persistent",
        ),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("charter_version", sa.SmallInteger(), nullable=False, server_default="1"),
        sa.Column("member_limit", sa.Integer(), nullable=False, server_default="150"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("city", "slug", name="uq_tribes_city_slug"),
    )
    op.create_index("ix_tribes_city_visibility", "tribes", ["city", "visibility"])
    op.create_index("ix_tribes_city_featured", "tribes", ["city", "is_featured"])

    op.create_table(
        "tribe_members",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tribe_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invited_by", sa.Uuid(), nullable=True),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("charter_accepted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tribe_id"], ["tribes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tribe_id", "user_id", name="uq_tribe_members_tribe_user"),
    )
    op.create_index("ix_tribe_members_user_active", "tribe_members", ["user_id"])
    op.create_index("ix_tribe_members_tribe_active", "tribe_members", ["tribe_id"])
    op.execute(
        """
        CREATE UNIQUE INDEX uq_tribe_members_one_active_owner
        ON tribe_members (tribe_id)
        WHERE role = 'owner' AND left_at IS NULL
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_tribe_members_active_membership
        ON tribe_members (tribe_id, user_id)
        WHERE left_at IS NULL
        """
    )

    op.create_table(
        "tribe_invitations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tribe_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("invited_by", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_by", sa.Uuid(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["accepted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tribe_id"], ["tribes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )

    op.create_table(
        "tribe_moderation_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tribe_id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column("target_post_id", sa.Uuid(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tribe_id"], ["tribes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column("posts", sa.Column("tribe_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_posts_tribe_id",
        "posts",
        "tribes",
        ["tribe_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_posts_tribe_created_at", "posts", ["tribe_id", "created_at"])
    op.execute(
        """
        ALTER TABLE posts ADD CONSTRAINT ck_posts_tribe_scope
        CHECK (
            tribe_id IS NULL
            OR (
                partner_offer_id IS NULL
                AND local_event_id IS NULL
                AND type = 'post'
            )
        )
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE posts DROP CONSTRAINT IF EXISTS ck_posts_tribe_scope")
    op.drop_index("ix_posts_tribe_created_at", table_name="posts")
    op.drop_constraint("fk_posts_tribe_id", "posts", type_="foreignkey")
    op.drop_column("posts", "tribe_id")
    op.drop_table("tribe_moderation_logs")
    op.drop_table("tribe_invitations")
    op.execute("DROP INDEX IF EXISTS uq_tribe_members_active_membership")
    op.execute("DROP INDEX IF EXISTS uq_tribe_members_one_active_owner")
    op.drop_table("tribe_members")
    op.drop_table("tribes")
