"""partner offers catalog fields (slug, value_label, conditions, is_featured)

Revision ID: 20260606_0027
Revises: 20260605_0026
Create Date: 2026-06-06

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260606_0027"
down_revision: str | None = "20260605_0026"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "partner_offers",
        sa.Column("slug", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "partner_offers",
        sa.Column("value_label", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "partner_offers",
        sa.Column("conditions", sa.Text(), nullable=True),
    )
    op.add_column(
        "partner_offers",
        sa.Column(
            "is_featured",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index("ix_partner_offers_slug", "partner_offers", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_partner_offers_slug", table_name="partner_offers")
    op.drop_column("partner_offers", "is_featured")
    op.drop_column("partner_offers", "conditions")
    op.drop_column("partner_offers", "value_label")
    op.drop_column("partner_offers", "slug")
