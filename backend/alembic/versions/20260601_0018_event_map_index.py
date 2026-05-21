"""event map bbox index (FEATURE-D / TICKET-D.3)

Revision ID: 20260601_0018
Revises: 20260531_0017
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260601_0018"
down_revision: str | None = "20260531_0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_local_events_map_bbox",
        "local_events",
        ["city", "starts_at"],
        postgresql_where=sa.text(
            "moderation_status = 'approved' "
            "AND visibility = 'public' "
            "AND is_cancelled = false "
            "AND latitude IS NOT NULL "
            "AND longitude IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index("ix_local_events_map_bbox", table_name="local_events")
