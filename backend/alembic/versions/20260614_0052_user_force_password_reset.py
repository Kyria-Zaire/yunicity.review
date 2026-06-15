"""users.force_password_reset (PROD-DATA-05E)

Revision ID: 20260614_0052
Revises: 20260614_0051
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260614_0052"
down_revision: str | None = "20260614_0051"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "force_password_reset" in columns:
        return

    op.add_column(
        "users",
        sa.Column(
            "force_password_reset",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column("users", "force_password_reset", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "force_password_reset" not in columns:
        return
    op.drop_column("users", "force_password_reset")
