"""Partner offer flash fields (TICKET-501).

Revision ID: 20260523_0009
Revises: 20260522_0008
Create Date: 2026-05-23
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260523_0009"
down_revision = "20260522_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "partner_offers",
        sa.Column(
            "is_flash",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "partner_offers",
        sa.Column("flash_ends_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "partner_offers",
        sa.Column("notification_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_partner_offers_flash_ends_required",
        "partner_offers",
        "(NOT is_flash) OR (flash_ends_at IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_partner_offers_flash_ends_required", "partner_offers", type_="check")
    op.drop_column("partner_offers", "notification_sent_at")
    op.drop_column("partner_offers", "flash_ends_at")
    op.drop_column("partner_offers", "is_flash")
