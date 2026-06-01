"""partner creator contents foundation (WEB-PARTNERS-06A)

Revision ID: 20260601_0028
Revises: 48b6c1d60978
Create Date: 2026-06-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260601_0028"
down_revision: str | None = "48b6c1d60978"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partner_creator_contents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("media_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("moderated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["moderated_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_partner_creator_contents_organization_id",
        "partner_creator_contents",
        ["organization_id"],
    )
    op.create_index(
        "ix_partner_creator_contents_status",
        "partner_creator_contents",
        ["status"],
    )
    op.add_column(
        "posts",
        sa.Column("partner_creator_content_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_posts_partner_creator_content_id",
        "posts",
        "partner_creator_contents",
        ["partner_creator_content_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_unique_constraint(
        "uq_posts_partner_creator_content_id",
        "posts",
        ["partner_creator_content_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_posts_partner_creator_content_id", "posts", type_="unique")
    op.drop_constraint("fk_posts_partner_creator_content_id", "posts", type_="foreignkey")
    op.drop_column("posts", "partner_creator_content_id")
    op.drop_index("ix_partner_creator_contents_status", table_name="partner_creator_contents")
    op.drop_index(
        "ix_partner_creator_contents_organization_id",
        table_name="partner_creator_contents",
    )
    op.drop_table("partner_creator_contents")
