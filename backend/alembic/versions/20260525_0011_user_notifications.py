"""User notifications inbox (TICKET-503).

Revision ID: 20260525_0011
Revises: 20260524_0010
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260525_0011"
down_revision: str | None = "20260524_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("target_user_id", sa.Uuid(), nullable=False),
        sa.Column("target_post_id", sa.Uuid(), nullable=True),
        sa.Column("deeplink", sa.String(length=512), nullable=True),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
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
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_notifications_target_user_created",
        "user_notifications",
        ["target_user_id", "created_at"],
    )
    op.create_index(
        "ix_user_notifications_target_user_unread",
        "user_notifications",
        ["target_user_id", "is_read"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_notifications_target_user_unread", table_name="user_notifications")
    op.drop_index(
        "ix_user_notifications_target_user_created",
        table_name="user_notifications",
    )
    op.drop_table("user_notifications")
