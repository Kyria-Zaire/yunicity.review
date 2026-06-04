"""local event cancel fields (ADMIN-05D-C1)

Revision ID: 20260604_0035
Revises: 20260604_0034
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260604_0035"
down_revision: str | None = "20260604_0034"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("local_events")}
    if "cancelled_at" not in columns:
        op.add_column(
            "local_events",
            sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "cancelled_by_user_id" not in columns:
        op.add_column(
            "local_events",
            sa.Column("cancelled_by_user_id", sa.Uuid(), nullable=True),
        )
        op.create_foreign_key(
            "fk_local_events_cancelled_by_user_id_users",
            "local_events",
            "users",
            ["cancelled_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    fks = {fk["name"] for fk in inspector.get_foreign_keys("local_events")}
    if "fk_local_events_cancelled_by_user_id_users" in fks:
        op.drop_constraint(
            "fk_local_events_cancelled_by_user_id_users",
            "local_events",
            type_="foreignkey",
        )
    columns = {col["name"] for col in inspector.get_columns("local_events")}
    if "cancelled_by_user_id" in columns:
        op.drop_column("local_events", "cancelled_by_user_id")
    if "cancelled_at" in columns:
        op.drop_column("local_events", "cancelled_at")
