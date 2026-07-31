"""tribe_join_requests (Bloc 4 — demande d'adhésion tribu privée)

Revision ID: 20260730_0060
Revises: 20260730_0059

Nouvelle table. Statut par timestamps (accepted_at / declined_at), comme tribe_invitations.
Index unique PARTIEL : une seule demande *pending* par (tribe, user) garantie EN BASE (pas
seulement en applicatif). Additive, réversible.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260730_0060"
down_revision: str | None = "20260730_0059"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tribe_join_requests",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "tribe_id",
            sa.Uuid(),
            sa.ForeignKey("tribes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "requested_by",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("declined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "decided_by",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "uq_tribe_join_request_pending",
        "tribe_join_requests",
        ["tribe_id", "requested_by"],
        unique=True,
        postgresql_where=sa.text("accepted_at IS NULL AND declined_at IS NULL"),
    )
    op.create_index(
        "ix_tribe_join_requests_tribe_created",
        "tribe_join_requests",
        ["tribe_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_tribe_join_requests_tribe_created", table_name="tribe_join_requests")
    op.drop_index("uq_tribe_join_request_pending", table_name="tribe_join_requests")
    op.drop_table("tribe_join_requests")
