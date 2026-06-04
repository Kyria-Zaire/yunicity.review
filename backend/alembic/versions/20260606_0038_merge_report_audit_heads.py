"""merge report audit and creator content admin heads

Revision ID: 20260606_0038
Revises: 20260604_0036, 20260606_0037
"""

from collections.abc import Sequence

revision: str = "20260606_0038"
down_revision: str | tuple[str, ...] | None = ("20260604_0036", "20260606_0037")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
