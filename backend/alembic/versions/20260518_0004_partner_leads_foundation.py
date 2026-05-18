"""partner leads foundation

Revision ID: 20260518_0004
Revises: 20260518_0003
Create Date: 2026-05-18

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260518_0004"
down_revision: str | None = "20260518_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partner_leads",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("organization_type", sa.String(length=32), nullable=True),
        sa.Column("contact_name", sa.String(length=160), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("website", sa.String(length=2048), nullable=True),
        sa.Column("instagram", sa.String(length=128), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column(
            "source",
            sa.String(length=32),
            server_default="physical_prospecting",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="new",
            nullable=False,
        ),
        sa.Column(
            "interested_passport",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "interested_events",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "interested_creator_program",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "interested_offers",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "interested_business_passport",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "tags",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("internal_rating", sa.Integer(), nullable=True),
        sa.Column("last_contacted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_followup_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("converted_organization_id", sa.Uuid(), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("converted_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("updated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column(
            "metadata",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("name_normalized", sa.String(length=160), nullable=False),
        sa.Column("city_normalized", sa.String(length=128), nullable=False),
        sa.Column("phone_normalized", sa.String(length=32), nullable=False),
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
        sa.CheckConstraint(
            "internal_rating IS NULL OR (internal_rating >= 1 AND internal_rating <= 5)",
            name="ck_partner_leads_internal_rating_range",
        ),
        sa.CheckConstraint(
            "char_length(coalesce(notes, '')) <= 5000",
            name="ck_partner_leads_notes_length",
        ),
        sa.ForeignKeyConstraint(
            ["converted_organization_id"],
            ["organizations.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["converted_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "name_normalized",
            "city_normalized",
            "phone_normalized",
            name="uq_partner_leads_name_city_phone",
        ),
    )
    op.create_index("ix_partner_leads_status", "partner_leads", ["status"])
    op.create_index("ix_partner_leads_source", "partner_leads", ["source"])
    op.create_index("ix_partner_leads_city", "partner_leads", ["city"])
    op.create_index("ix_partner_leads_name", "partner_leads", ["name"])
    op.create_index(
        "ix_partner_leads_converted_organization_id",
        "partner_leads",
        ["converted_organization_id"],
    )
    op.create_index(
        "ix_partner_leads_next_followup_at",
        "partner_leads",
        ["next_followup_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_partner_leads_next_followup_at", table_name="partner_leads")
    op.drop_index(
        "ix_partner_leads_converted_organization_id",
        table_name="partner_leads",
    )
    op.drop_index("ix_partner_leads_name", table_name="partner_leads")
    op.drop_index("ix_partner_leads_city", table_name="partner_leads")
    op.drop_index("ix_partner_leads_source", table_name="partner_leads")
    op.drop_index("ix_partner_leads_status", table_name="partner_leads")
    op.drop_table("partner_leads")
