"""users.is_system_account (PLATFORM-AUTH-RECOVERY-01)

Revision ID: 20260608_0040
Revises: 20260607_0039
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260608_0040"
down_revision: str | None = "20260607_0039"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "is_system_account" in columns:
        return

    op.add_column(
        "users",
        sa.Column(
            "is_system_account",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column("users", "is_system_account", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "is_system_account" not in columns:
        return
    op.drop_column("users", "is_system_account")
