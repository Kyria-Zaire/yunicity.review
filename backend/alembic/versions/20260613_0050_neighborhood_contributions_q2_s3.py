"""Quartiers V2 Q2-S3 citizen contributions delta (FEATURE-QUARTIERS-V2 / Q2-S3-01).

Revision ID: 20260613_0050
Revises: 20260613_0049
"""
# ruff: noqa: E501

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260613_0050"
down_revision: str | None = "20260613_0049"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "neighborhood_contributions",
        sa.Column("display_identity_type", sa.String(length=16), nullable=True),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column("display_identity_label", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column(
            "passport_verified_snapshot",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column("rejection_reason_code", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "neighborhood_contributions",
        sa.Column("rejection_note", sa.String(length=500), nullable=True),
    )

    op.execute(
        """
        UPDATE neighborhood_contributions
        SET
            display_identity_type = 'pseudo',
            display_identity_label = '',
            submitted_at = created_at
        WHERE submitted_at IS NULL
        """
    )

    op.alter_column(
        "neighborhood_contributions",
        "display_identity_type",
        existing_type=sa.String(length=16),
        nullable=False,
        server_default="pseudo",
    )
    op.alter_column(
        "neighborhood_contributions",
        "display_identity_label",
        existing_type=sa.String(length=120),
        nullable=False,
        server_default="",
    )
    op.alter_column(
        "neighborhood_contributions",
        "submitted_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )

    op.create_index(
        "ix_neighborhood_contributions_author_status",
        "neighborhood_contributions",
        ["author_user_id", "status"],
    )
    op.create_index(
        "ix_neighborhood_contributions_author_hood_status",
        "neighborhood_contributions",
        ["author_user_id", "neighborhood_id", "status"],
    )
    op.create_index(
        "ix_neighborhood_contributions_hood_approved_at",
        "neighborhood_contributions",
        ["neighborhood_id", sa.text("approved_at DESC")],
        postgresql_where=sa.text("status = 'approved'"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_neighborhood_contributions_hood_approved_at",
        table_name="neighborhood_contributions",
    )
    op.drop_index(
        "ix_neighborhood_contributions_author_hood_status",
        table_name="neighborhood_contributions",
    )
    op.drop_index(
        "ix_neighborhood_contributions_author_status",
        table_name="neighborhood_contributions",
    )
    op.drop_column("neighborhood_contributions", "rejection_note")
    op.drop_column("neighborhood_contributions", "rejection_reason_code")
    op.drop_column("neighborhood_contributions", "approved_at")
    op.drop_column("neighborhood_contributions", "submitted_at")
    op.drop_column("neighborhood_contributions", "passport_verified_snapshot")
    op.drop_column("neighborhood_contributions", "display_identity_label")
    op.drop_column("neighborhood_contributions", "display_identity_type")
