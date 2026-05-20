"""Passport reputation & tier history (TICKET-502).

Revision ID: 20260524_0010
Revises: 20260523_0009
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260524_0010"
down_revision: str | None = "20260523_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TIER_DESCRIPTIONS: dict[str, str] = {
    "basic": "Citoyen·ne Yunicity — votre place dans la ville commence ici.",
    "silver": "Engagement régulier sur le territoire — présence locale reconnue.",
    "gold": "Ambassadeur·rice de votre ville — contribution durable et crédible.",
    "neo_arrivant": "Bienvenue sur le territoire — parcours d’accueil local.",
    "press_creator": "Voix locale — création et médias au service du territoire.",
    "business": "Passport organisation — réservé aux lieux partenaires.",
}


def upgrade() -> None:
    op.add_column(
        "passports",
        sa.Column("reputation_score", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "passports",
        sa.Column("tier_unlocked_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "passport_tier_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("passport_id", sa.Uuid(), nullable=False),
        sa.Column("from_tier_code", sa.String(length=32), nullable=False),
        sa.Column("to_tier_code", sa.String(length=32), nullable=False),
        sa.Column("reason", sa.String(length=64), nullable=False),
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
        sa.ForeignKeyConstraint(["passport_id"], ["passports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_passport_tier_events_passport_id",
        "passport_tier_events",
        ["passport_id"],
    )

    for code, description in _TIER_DESCRIPTIONS.items():
        op.execute(
            sa.text("UPDATE passport_tiers SET description = :desc WHERE code = :code").bindparams(
                desc=description, code=code
            )
        )


def downgrade() -> None:
    op.drop_index("ix_passport_tier_events_passport_id", table_name="passport_tier_events")
    op.drop_table("passport_tier_events")
    op.drop_column("passports", "tier_unlocked_at")
    op.drop_column("passports", "reputation_score")
