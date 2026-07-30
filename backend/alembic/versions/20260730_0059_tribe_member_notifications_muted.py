"""tribe_members.notifications_muted (Bloc 3 — notifications tribu)

Revision ID: 20260730_0059
Revises: 20260719_0058

Colonne additive : mute des notifications d'une tribu pour un membre donné. NOT NULL avec
DEFAULT false (server_default) — sûre sur les lignes existantes (backfill implicite), réversible.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260730_0059"
down_revision: str | None = "20260719_0058"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tribe_members",
        sa.Column(
            "notifications_muted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("tribe_members", "notifications_muted")
