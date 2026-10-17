"""local_videos media_width / media_height (orientation feed desktop)

Revision ID: 20260829_0061
Revises: 20260730_0060
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_0061"
down_revision: str | None = "20260730_0060"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("local_videos", sa.Column("media_width", sa.Integer(), nullable=True))
    op.add_column("local_videos", sa.Column("media_height", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("local_videos", "media_height")
    op.drop_column("local_videos", "media_width")
