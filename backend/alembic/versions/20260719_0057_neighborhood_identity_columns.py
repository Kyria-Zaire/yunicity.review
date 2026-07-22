"""neighborhood identity and life columns (QUARTIER-01 phase 3a)

Revision ID: 20260719_0057
Revises: 20260718_0056

Six nullable text columns on neighborhoods, for the editorial content of the twelve Reims
districts: identity (audience, type) and lived experience (local life, green spaces,
mobility, daily life).

All nullable: the twelve existing rows keep working untouched, and each district gains its
content as it is authored. Text rather than structured columns is a deliberate first pass —
should mobility turn out to carry real structure (lines, travel times), that is a separate
migration rather than a guess made now.

Idempotent: IF NOT EXISTS on the way up, IF EXISTS on the way down, so a partial run can be
replayed.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260719_0057"
down_revision: str | None = "20260718_0056"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_COLUMNS = (
    "audience",
    "neighborhood_type",
    "local_life",
    "green_spaces",
    "mobility",
    "daily_life",
)


def upgrade() -> None:
    for column in _COLUMNS:
        op.execute(f"ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS {column} TEXT")


def downgrade() -> None:
    for column in _COLUMNS:
        op.execute(f"ALTER TABLE neighborhoods DROP COLUMN IF EXISTS {column}")
