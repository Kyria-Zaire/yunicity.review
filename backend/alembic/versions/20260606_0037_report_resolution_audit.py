"""report resolution note and admin actions audit (ADMIN-07D-A)

Revision ID: 20260606_0037
Revises: 20260606_0027
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260606_0037"
down_revision: str | None = "20260606_0027"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("reports")}
    if "resolution_note" not in columns:
        op.add_column("reports", sa.Column("resolution_note", sa.Text(), nullable=True))

    if "report_admin_actions" in inspector.get_table_names():
        return

    op.create_table(
        "report_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("report_id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=20), nullable=True),
        sa.Column("new_status", sa.String(length=20), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_report_admin_actions_report_id",
        "report_admin_actions",
        ["report_id"],
    )
    op.create_index(
        "ix_report_admin_actions_actor_user_id",
        "report_admin_actions",
        ["actor_user_id"],
    )
    op.create_index(
        "ix_report_admin_actions_action",
        "report_admin_actions",
        ["action"],
    )
    op.create_index(
        "ix_report_admin_actions_created_at",
        "report_admin_actions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_report_admin_actions_created_at", table_name="report_admin_actions")
    op.drop_index("ix_report_admin_actions_action", table_name="report_admin_actions")
    op.drop_index("ix_report_admin_actions_actor_user_id", table_name="report_admin_actions")
    op.drop_index("ix_report_admin_actions_report_id", table_name="report_admin_actions")
    op.drop_table("report_admin_actions")
    op.drop_column("reports", "resolution_note")
