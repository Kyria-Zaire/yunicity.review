"""activation waves foundation (ADMIN-02C-A)

Revision ID: 20260604_0030
Revises: 20260603_0029
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260604_0030"
down_revision: str | None = "20260603_0029"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CHECKLIST_DEFAULT_SQL = (
    "'{\"contact_confirmed\": false, \"assets_received\": false, "
    "\"passport_offer_ready\": false, \"qr_ready\": false, "
    "\"go_public_ready\": false}'::jsonb"
)


def upgrade() -> None:
    op.create_table(
        "activation_waves",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("city", sa.String(length=64), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("city", "code", name="uq_activation_waves_city_code"),
    )
    op.create_index("ix_activation_waves_city", "activation_waves", ["city"])
    op.create_index("ix_activation_waves_status", "activation_waves", ["status"])

    op.create_table(
        "activation_wave_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("wave_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("partner_profile_id", sa.Uuid(), nullable=True),
        sa.Column("partner_name_snapshot", sa.String(length=160), nullable=False),
        sa.Column("partner_slug_snapshot", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "checklist",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text(_CHECKLIST_DEFAULT_SQL),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["partner_profile_id"],
            ["partner_profiles.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["wave_id"], ["activation_waves.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "wave_id",
            "partner_name_snapshot",
            name="uq_activation_wave_items_wave_name",
        ),
    )
    op.create_index(
        "ix_activation_wave_items_wave_id",
        "activation_wave_items",
        ["wave_id"],
    )
    op.create_index(
        "ix_activation_wave_items_organization_id",
        "activation_wave_items",
        ["organization_id"],
    )
    op.create_index(
        "ix_activation_wave_items_status",
        "activation_wave_items",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_activation_wave_items_status", table_name="activation_wave_items")
    op.drop_index(
        "ix_activation_wave_items_organization_id",
        table_name="activation_wave_items",
    )
    op.drop_index("ix_activation_wave_items_wave_id", table_name="activation_wave_items")
    op.drop_table("activation_wave_items")
    op.drop_index("ix_activation_waves_status", table_name="activation_waves")
    op.drop_index("ix_activation_waves_city", table_name="activation_waves")
    op.drop_table("activation_waves")
