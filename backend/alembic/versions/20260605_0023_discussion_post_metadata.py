"""Discussion post metadata (WEB-DISCUSSIONS-02).

Revision ID: 20260605_0023
Revises: 20260605_0022
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0023"
down_revision: str | None = "20260605_0022"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column("discussion_category", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "posts",
        sa.Column(
            "discussion_tags",
            sa.dialects.postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "posts",
        sa.Column("linked_tribe_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_posts_linked_tribe_id",
        "posts",
        "tribes",
        ["linked_tribe_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_posts_discussion_category", "posts", ["discussion_category"])


def downgrade() -> None:
    op.drop_index("ix_posts_discussion_category", table_name="posts")
    op.drop_constraint("fk_posts_linked_tribe_id", "posts", type_="foreignkey")
    op.drop_column("posts", "linked_tribe_id")
    op.drop_column("posts", "discussion_tags")
    op.drop_column("posts", "discussion_category")
