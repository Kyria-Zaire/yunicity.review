"""offer admin actions audit (ADMIN-04E-B1)

Revision ID: 20260604_0033
Revises: 20260603_0032
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260604_0033"
down_revision: str | None = "20260603_0032"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "offer_admin_actions" in inspector.get_table_names():
        return

    op.create_table(
        "offer_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("partner_offer_id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["partner_offer_id"],
            ["partner_offers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_offer_admin_actions_partner_offer_id",
        "offer_admin_actions",
        ["partner_offer_id"],
    )
    op.create_index(
        "ix_offer_admin_actions_actor_user_id",
        "offer_admin_actions",
        ["actor_user_id"],
    )
    op.create_index(
        "ix_offer_admin_actions_action",
        "offer_admin_actions",
        ["action"],
    )
    op.create_index(
        "ix_offer_admin_actions_created_at",
        "offer_admin_actions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_offer_admin_actions_created_at", table_name="offer_admin_actions")
    op.drop_index("ix_offer_admin_actions_action", table_name="offer_admin_actions")
    op.drop_index("ix_offer_admin_actions_actor_user_id", table_name="offer_admin_actions")
    op.drop_index(
        "ix_offer_admin_actions_partner_offer_id",
        table_name="offer_admin_actions",
    )
    op.drop_table("offer_admin_actions")
