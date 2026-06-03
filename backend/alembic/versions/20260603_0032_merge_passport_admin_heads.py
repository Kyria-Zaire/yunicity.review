"""merge passport admin actions and activation waves heads

Revision ID: 20260603_0032
Revises: 20260603_0031, 20260604_0030
"""

from collections.abc import Sequence

revision: str = "20260603_0032"
down_revision: str | tuple[str, ...] | None = ("20260603_0031", "20260604_0030")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
