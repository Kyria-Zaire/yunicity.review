"""users flags: guarantee no server default (PASSPORT-PRESENCE-01)

Revision ID: 20261126_0068
Revises: 20261126_0067

Corrective CONVERGENCE migration: it changes no canonical schema. For
``users.is_system_account`` (20260608_0040) and ``users.force_password_reset``
(20260614_0052), the canonical state, before and after this revision, is "no server
default": both migrations add the column with ``DEFAULT false`` then drop the default.

Both, however, return early when the column already exists. A database whose column
predates them (built by ``create_all`` while the model still declared
``server_default="false"``) therefore keeps the old default while being stamped past
them. Editing 0040 or 0052 would not reach such a database: this revision enforces the
postcondition instead.

Postcondition after upgrade, whatever the history: neither column has a server default.
``DROP DEFAULT`` is a no-op when no default exists (PostgreSQL), so the upgrade is
idempotent, takes only a brief lock per column and rewrites no row. Values are untouched.
The ORM always supplies both values (``default=False``), in the deployed application too.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20261126_0068"
down_revision: str | None = "20261126_0067"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_COLUMNS = ("is_system_account", "force_password_reset")


def upgrade() -> None:
    for column in _COLUMNS:
        op.alter_column("users", column, server_default=None)


def downgrade() -> None:
    # Intentionally a no-op (convergence migration). The canonical schema at 20261126_0067
    # (defined by 0040 and 0052) already has NO server default on these columns; the
    # divergent pre-upgrade state is history-dependent and non-conforming. Restoring
    # ``DEFAULT false`` here would recreate exactly that non-conforming state.
    pass
