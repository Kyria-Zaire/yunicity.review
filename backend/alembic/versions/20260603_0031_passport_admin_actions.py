"""passport admin actions audit (ADMIN-03B)

Revision ID: 20260603_0031
Revises: 48b6c1d60978
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260603_0031"
down_revision: str | None = "48b6c1d60978"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "passport_admin_actions" in inspector.get_table_names():
        return

    op.create_table(
        "passport_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("passport_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["passport_id"], ["passports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_passport_admin_actions_passport_id",
        "passport_admin_actions",
        ["passport_id"],
    )
    op.create_index(
        "ix_passport_admin_actions_user_id",
        "passport_admin_actions",
        ["user_id"],
    )
    op.create_index(
        "ix_passport_admin_actions_action",
        "passport_admin_actions",
        ["action"],
    )
    op.create_index(
        "ix_passport_admin_actions_actor_user_id",
        "passport_admin_actions",
        ["actor_user_id"],
    )
    op.create_index(
        "ix_passport_admin_actions_created_at",
        "passport_admin_actions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_passport_admin_actions_created_at", table_name="passport_admin_actions")
    op.drop_index("ix_passport_admin_actions_actor_user_id", table_name="passport_admin_actions")
    op.drop_index("ix_passport_admin_actions_action", table_name="passport_admin_actions")
    op.drop_index("ix_passport_admin_actions_user_id", table_name="passport_admin_actions")
    op.drop_index("ix_passport_admin_actions_passport_id", table_name="passport_admin_actions")
    op.drop_table("passport_admin_actions")
