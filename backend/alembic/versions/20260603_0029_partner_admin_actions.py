"""partner admin actions audit (ADMIN-02D3A)

Revision ID: 20260603_0029
Revises: 20260601_0028
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260603_0029"
down_revision: str | None = "20260601_0028"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partner_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("partner_profile_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=True),
        sa.Column("previous_visibility", sa.String(length=16), nullable=True),
        sa.Column("new_visibility", sa.String(length=16), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["partner_profile_id"],
            ["partner_profiles.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_partner_admin_actions_organization_id",
        "partner_admin_actions",
        ["organization_id"],
    )
    op.create_index(
        "ix_partner_admin_actions_partner_profile_id",
        "partner_admin_actions",
        ["partner_profile_id"],
    )
    op.create_index(
        "ix_partner_admin_actions_action",
        "partner_admin_actions",
        ["action"],
    )
    op.create_index(
        "ix_partner_admin_actions_actor_user_id",
        "partner_admin_actions",
        ["actor_user_id"],
    )
    op.create_index(
        "ix_partner_admin_actions_created_at",
        "partner_admin_actions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_partner_admin_actions_created_at", table_name="partner_admin_actions")
    op.drop_index("ix_partner_admin_actions_actor_user_id", table_name="partner_admin_actions")
    op.drop_index("ix_partner_admin_actions_action", table_name="partner_admin_actions")
    op.drop_index(
        "ix_partner_admin_actions_partner_profile_id",
        table_name="partner_admin_actions",
    )
    op.drop_index(
        "ix_partner_admin_actions_organization_id",
        table_name="partner_admin_actions",
    )
    op.drop_table("partner_admin_actions")
