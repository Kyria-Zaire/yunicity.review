"""search full-text vectors (FEATURE-B / TICKET-B.4)

Revision ID: 20260531_0017
Revises: 20260530_0016
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from app.db.search_fts import install_search_fts, uninstall_search_fts
from sqlalchemy.dialects.postgresql import TSVECTOR

revision: str = "20260531_0017"
down_revision: str | None = "20260530_0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLES = (
    "posts",
    "local_events",
    "organizations",
    "partner_offers",
    "tribes",
    "user_profiles",
    "neighborhoods",
)


def upgrade() -> None:
    for table in _TABLES:
        op.add_column(
            table,
            sa.Column(
                "search_vector",
                TSVECTOR(),
                nullable=False,
                server_default=sa.text("''::tsvector"),
            ),
        )
        op.create_index(
            f"ix_{table}_search_vector_gin",
            table,
            ["search_vector"],
            postgresql_using="gin",
        )

    connection = op.get_bind()
    install_search_fts(connection)


def downgrade() -> None:
    connection = op.get_bind()
    uninstall_search_fts(connection)
    for table in reversed(_TABLES):
        op.drop_index(f"ix_{table}_search_vector_gin", table_name=table)
        op.drop_column(table, "search_vector")
