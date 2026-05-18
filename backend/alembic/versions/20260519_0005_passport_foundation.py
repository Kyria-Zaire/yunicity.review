"""passport foundation

Revision ID: 20260519_0005
Revises: 20260518_0004
Create Date: 2026-05-19

"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260519_0005"
down_revision: str | None = "20260518_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TIER_SEED_ROWS: tuple[dict[str, object], ...] = (
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000001"),
        "code": "basic",
        "name": "Basic",
        "display_order": 10,
        "is_publicly_visible": True,
        "flags": {},
    },
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000002"),
        "code": "silver",
        "name": "Silver",
        "display_order": 20,
        "is_publicly_visible": True,
        "flags": {"min_engagement": "regular"},
    },
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000003"),
        "code": "gold",
        "name": "Gold",
        "display_order": 30,
        "is_publicly_visible": True,
        "flags": {"min_engagement": "high"},
    },
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000004"),
        "code": "neo_arrivant",
        "name": "Néo-arrivant",
        "display_order": 40,
        "is_publicly_visible": True,
        "flags": {"audience": "newcomer"},
    },
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000005"),
        "code": "press_creator",
        "name": "Press / Creator",
        "display_order": 50,
        "is_publicly_visible": True,
        "flags": {"audience": "press_creator"},
    },
    {
        "id": uuid.UUID("a1000000-0000-4000-8000-000000000006"),
        "code": "business",
        "name": "Business",
        "display_order": 60,
        "is_publicly_visible": False,
        "flags": {"scope": "organization"},
    },
)


def upgrade() -> None:
    op.create_table(
        "passport_tiers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "is_publicly_visible",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "flags",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_passport_tiers_code"),
    )
    op.create_index(
        "ix_passport_tiers_display_order",
        "passport_tiers",
        ["display_order"],
        unique=False,
    )

    op.create_table(
        "passports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("tier_id", sa.Uuid(), nullable=False),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("passport_number", sa.String(length=32), nullable=False),
        sa.Column("qr_token", sa.String(length=128), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="active",
            nullable=False,
        ),
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("onboarding_step", sa.String(length=64), nullable=True),
        sa.Column("stamps_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("redemptions_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_stamp_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
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
        sa.ForeignKeyConstraint(["tier_id"], ["passport_tiers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("passport_number", name="uq_passports_passport_number"),
        sa.UniqueConstraint("qr_token", name="uq_passports_qr_token"),
    )
    op.create_index("ix_passports_user_id", "passports", ["user_id"], unique=False)
    op.create_index("ix_passports_tier_id", "passports", ["tier_id"], unique=False)
    op.create_index("ix_passports_city", "passports", ["city"], unique=False)
    op.create_index("ix_passports_status", "passports", ["status"], unique=False)
    op.create_index(
        "uq_passports_one_active_per_user",
        "passports",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    op.create_table(
        "passport_stamps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("passport_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column(
            "stamp_source",
            sa.String(length=32),
            server_default="organization",
            nullable=False,
        ),
        sa.Column(
            "stamped_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("stamped_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "metadata",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["passport_id"], ["passports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["stamped_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "passport_id",
            "organization_id",
            name="uq_passport_stamps_passport_organization",
        ),
    )
    op.create_index(
        "ix_passport_stamps_passport_id", "passport_stamps", ["passport_id"], unique=False
    )
    op.create_index(
        "ix_passport_stamps_organization_id",
        "passport_stamps",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        "ix_passport_stamps_stamped_at", "passport_stamps", ["stamped_at"], unique=False
    )

    op.create_table(
        "partner_offers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("offer_type", sa.String(length=32), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="draft",
            nullable=False,
        ),
        sa.Column("tier_code_required", sa.String(length=32), nullable=True),
        sa.Column("max_redemptions_total", sa.Integer(), nullable=True),
        sa.Column(
            "max_redemptions_per_passport",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column(
            "metadata",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
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
        sa.CheckConstraint(
            "max_redemptions_per_passport >= 1",
            name="ck_partner_offers_max_redemptions_per_passport_positive",
        ),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_partner_offers_organization_id",
        "partner_offers",
        ["organization_id"],
        unique=False,
    )
    op.create_index("ix_partner_offers_status", "partner_offers", ["status"], unique=False)
    op.create_index("ix_partner_offers_offer_type", "partner_offers", ["offer_type"], unique=False)

    op.create_table(
        "passport_offer_redemptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("passport_id", sa.Uuid(), nullable=False),
        sa.Column("partner_offer_id", sa.Uuid(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
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
        sa.ForeignKeyConstraint(["partner_offer_id"], ["partner_offers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["passport_id"], ["passports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "passport_id",
            "partner_offer_id",
            name="uq_passport_offer_redemptions_passport_offer",
        ),
    )
    op.create_index(
        "ix_passport_offer_redemptions_passport_id",
        "passport_offer_redemptions",
        ["passport_id"],
        unique=False,
    )
    op.create_index(
        "ix_passport_offer_redemptions_partner_offer_id",
        "passport_offer_redemptions",
        ["partner_offer_id"],
        unique=False,
    )
    op.create_index(
        "ix_passport_offer_redemptions_status",
        "passport_offer_redemptions",
        ["status"],
        unique=False,
    )

    tiers_table = sa.table(
        "passport_tiers",
        sa.column("id", sa.Uuid()),
        sa.column("code", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("display_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("is_publicly_visible", sa.Boolean()),
        sa.column("flags", sa.dialects.postgresql.JSONB()),
    )
    op.bulk_insert(
        tiers_table,
        [
            {
                "id": row["id"],
                "code": row["code"],
                "name": row["name"],
                "description": None,
                "display_order": row["display_order"],
                "is_active": True,
                "is_publicly_visible": row["is_publicly_visible"],
                "flags": row["flags"],
            }
            for row in _TIER_SEED_ROWS
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_passport_offer_redemptions_status", table_name="passport_offer_redemptions")
    op.drop_index(
        "ix_passport_offer_redemptions_partner_offer_id",
        table_name="passport_offer_redemptions",
    )
    op.drop_index(
        "ix_passport_offer_redemptions_passport_id",
        table_name="passport_offer_redemptions",
    )
    op.drop_table("passport_offer_redemptions")

    op.drop_index("ix_partner_offers_offer_type", table_name="partner_offers")
    op.drop_index("ix_partner_offers_status", table_name="partner_offers")
    op.drop_index("ix_partner_offers_organization_id", table_name="partner_offers")
    op.drop_table("partner_offers")

    op.drop_index("ix_passport_stamps_stamped_at", table_name="passport_stamps")
    op.drop_index("ix_passport_stamps_organization_id", table_name="passport_stamps")
    op.drop_index("ix_passport_stamps_passport_id", table_name="passport_stamps")
    op.drop_table("passport_stamps")

    op.drop_index("uq_passports_one_active_per_user", table_name="passports")
    op.drop_index("ix_passports_status", table_name="passports")
    op.drop_index("ix_passports_city", table_name="passports")
    op.drop_index("ix_passports_tier_id", table_name="passports")
    op.drop_index("ix_passports_user_id", table_name="passports")
    op.drop_table("passports")

    op.drop_index("ix_passport_tiers_display_order", table_name="passport_tiers")
    op.drop_table("passport_tiers")
