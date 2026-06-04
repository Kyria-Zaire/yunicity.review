"""staff admin actions audit (ADMIN-08B)

Revision ID: 20260607_0039
Revises: 20260606_0038
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260607_0039"
down_revision: str | None = "20260606_0038"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "staff_admin_actions" in inspector.get_table_names():
        return

    op.create_table(
        "staff_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("previous_roles", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_roles", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_staff_admin_actions_target_user_id",
        "staff_admin_actions",
        ["target_user_id"],
    )
    op.create_index(
        "ix_staff_admin_actions_actor_user_id",
        "staff_admin_actions",
        ["actor_user_id"],
    )
    op.create_index(
        "ix_staff_admin_actions_action",
        "staff_admin_actions",
        ["action"],
    )
    op.create_index(
        "ix_staff_admin_actions_created_at",
        "staff_admin_actions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_staff_admin_actions_created_at", table_name="staff_admin_actions")
    op.drop_index("ix_staff_admin_actions_action", table_name="staff_admin_actions")
    op.drop_index("ix_staff_admin_actions_actor_user_id", table_name="staff_admin_actions")
    op.drop_index("ix_staff_admin_actions_target_user_id", table_name="staff_admin_actions")
    op.drop_table("staff_admin_actions")
