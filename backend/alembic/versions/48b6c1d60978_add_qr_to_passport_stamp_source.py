"""add qr to passport_stamp_source

Revision ID: 48b6c1d60978
Revises: 20260606_0027
Create Date: 2026-05-30 22:14:20.000713

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = '48b6c1d60978'
down_revision: str | None = '20260606_0027'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # PassportStampSource is stored as String(32) — no DDL change needed.
    # This migration documents the addition of the 'qr' source value.
    pass


def downgrade() -> None:
    pass
