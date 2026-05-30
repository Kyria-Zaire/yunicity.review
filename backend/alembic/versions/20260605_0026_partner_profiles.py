"""partner profiles (WEB-PARTNERS-01)

Revision ID: 20260605_0026
Revises: 20260605_0025
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0026"
down_revision: str | None = "20260605_0025"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partner_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("partner_status", sa.String(length=32), nullable=False),
        sa.Column("partnership_type", sa.String(length=32), nullable=False),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("contract_reference", sa.String(length=128), nullable=True),
        sa.Column("contact_name", sa.String(length=160), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=32), nullable=True),
        sa.Column("public_partner_label", sa.String(length=160), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("featured_priority", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notes_internal", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id"),
    )
    op.create_index(
        "ix_partner_profiles_organization_id",
        "partner_profiles",
        ["organization_id"],
        unique=True,
    )
    op.create_index(
        "ix_partner_profiles_partner_status",
        "partner_profiles",
        ["partner_status"],
    )
    op.create_index(
        "ix_partner_profiles_partnership_type",
        "partner_profiles",
        ["partnership_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_partner_profiles_partnership_type", table_name="partner_profiles")
    op.drop_index("ix_partner_profiles_partner_status", table_name="partner_profiles")
    op.drop_index("ix_partner_profiles_organization_id", table_name="partner_profiles")
    op.drop_table("partner_profiles")
