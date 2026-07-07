"""scheduled post published marker (FEED-SCHED-01)

Revision ID: 20260708_0054
Revises: 20260704_0053
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260708_0054"
down_revision: str | None = "20260704_0053"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("posts")}

    if "scheduled_published_at" not in columns:
        op.add_column(
            "posts",
            sa.Column("scheduled_published_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("posts", "scheduled_published_at")
