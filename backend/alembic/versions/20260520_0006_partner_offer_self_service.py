"""Partner offer self-service workflow — status refactor + moderation audit (TICKET-305A).

Revision ID: 20260520_0006
Revises: 20260519_0005
Create Date: 2026-05-20

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260520_0006"
down_revision = "20260519_0005"
branch_labels = None
depends_on = None


def _column_names(table: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {col["name"] for col in inspector.get_columns(table)}


def upgrade() -> None:
    columns = _column_names("partner_offers")

    if "is_active" not in columns:
        op.add_column(
            "partner_offers",
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )

    if "moderated_by_user_id" not in columns:
        op.add_column(
            "partner_offers",
            sa.Column("moderated_by_user_id", sa.Uuid(), nullable=True),
        )
        op.create_foreign_key(
            "fk_partner_offers_moderated_by_user_id",
            "partner_offers",
            "users",
            ["moderated_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )

    if "moderated_at" not in columns:
        op.add_column(
            "partner_offers",
            sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "rejection_reason" not in columns:
        op.add_column("partner_offers", sa.Column("rejection_reason", sa.Text(), nullable=True))

    # Idempotent legacy status → offer_status (status column).
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET status = 'published', is_active = true
            WHERE status = 'active'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET status = 'archived', is_active = false
            WHERE status IN ('paused', 'expired', 'archived')
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET is_active = true
            WHERE status = 'published' AND is_active = false
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET is_active = false
            WHERE status <> 'published' AND is_active = true
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET status = 'active'
            WHERE status = 'published'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET status = 'draft'
            WHERE status IN ('pending_review', 'rejected')
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE partner_offers
            SET status = 'archived'
            WHERE status = 'archived'
            """
        )
    )

    columns = _column_names("partner_offers")
    if "rejection_reason" in columns:
        op.drop_column("partner_offers", "rejection_reason")
    if "moderated_at" in columns:
        op.drop_column("partner_offers", "moderated_at")
    if "moderated_by_user_id" in columns:
        op.drop_constraint(
            "fk_partner_offers_moderated_by_user_id",
            "partner_offers",
            type_="foreignkey",
        )
        op.drop_column("partner_offers", "moderated_by_user_id")
    if "is_active" in columns:
        op.drop_column("partner_offers", "is_active")
