"""Tribe invitation invitee user (TICKET-A.5).

Revision ID: 20260530_0016
Revises: 20260529_0015
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260530_0016"
down_revision: str | None = "20260529_0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tribe_invitations",
        sa.Column("invited_user_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_tribe_invitations_invited_user_id",
        "tribe_invitations",
        "users",
        ["invited_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_tribe_invitations_invited_user_pending",
        "tribe_invitations",
        ["invited_user_id"],
        unique=False,
        postgresql_where=sa.text(
            "invited_user_id IS NOT NULL AND accepted_at IS NULL AND revoked_at IS NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index("ix_tribe_invitations_invited_user_pending", table_name="tribe_invitations")
    op.drop_constraint("fk_tribe_invitations_invited_user_id", "tribe_invitations", type_="foreignkey")
    op.drop_column("tribe_invitations", "invited_user_id")
