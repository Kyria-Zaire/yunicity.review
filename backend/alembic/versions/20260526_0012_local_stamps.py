"""Local stamp definitions & citizen memories (TICKET-504).

Revision ID: 20260526_0012
Revises: 20260525_0011
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260526_0012"
down_revision: str | None = "20260525_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STAMP_DEFINITIONS: tuple[dict[str, object], ...] = (
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000001"),
        "slug": "first_local_place",
        "title": "Premier lieu découvert",
        "description": "Votre première expérience chez un partenaire local.",
        "icon": "place",
        "trigger_type": "first_redemption_per_organization",
        "city_scoped": True,
    },
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000002"),
        "slug": "first_scan_validated",
        "title": "Premier passage validé",
        "description": "Votre première offre utilisée sur le territoire.",
        "icon": "scan",
        "trigger_type": "first_scan_redemption",
        "city_scoped": True,
    },
    {
        "id": uuid.UUID("b1000000-0000-4000-8000-000000000003"),
        "slug": "first_flash_memory",
        "title": "Souvenir flash",
        "description": "Une offre locale limitée dans le temps, vécue en vrai.",
        "icon": "flash",
        "trigger_type": "first_flash_redemption",
        "city_scoped": True,
    },
)


def upgrade() -> None:
    op.create_table(
        "stamp_definitions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=32), nullable=False, server_default="seal"),
        sa.Column("trigger_type", sa.String(length=64), nullable=False),
        sa.Column("city_scoped", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
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
        sa.UniqueConstraint("slug", name="uq_stamp_definitions_slug"),
    )

    op.create_table(
        "citizen_local_stamps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("stamp_definition_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("partner_offer_id", sa.Uuid(), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column(
            "earned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["partner_offer_id"], ["partner_offers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["stamp_definition_id"],
            ["stamp_definitions.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_citizen_local_stamps_user_earned",
        "citizen_local_stamps",
        ["user_id", "earned_at"],
    )

    op.create_index(
        "uq_citizen_local_stamps_user_def_org",
        "citizen_local_stamps",
        ["user_id", "stamp_definition_id", "organization_id"],
        unique=True,
        postgresql_where=sa.text("organization_id IS NOT NULL"),
    )
    op.create_index(
        "uq_citizen_local_stamps_user_def_global",
        "citizen_local_stamps",
        ["user_id", "stamp_definition_id"],
        unique=True,
        postgresql_where=sa.text("organization_id IS NULL"),
    )

    definitions = sa.table(
        "stamp_definitions",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("title", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("icon", sa.String()),
        sa.column("trigger_type", sa.String()),
        sa.column("city_scoped", sa.Boolean()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(definitions, list(_STAMP_DEFINITIONS))


def downgrade() -> None:
    op.drop_index("uq_citizen_local_stamps_user_def_global", table_name="citizen_local_stamps")
    op.drop_index("uq_citizen_local_stamps_user_def_org", table_name="citizen_local_stamps")
    op.drop_index("ix_citizen_local_stamps_user_earned", table_name="citizen_local_stamps")
    op.drop_table("citizen_local_stamps")
    op.drop_table("stamp_definitions")
