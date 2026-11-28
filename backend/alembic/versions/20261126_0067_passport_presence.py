"""passport presence validation (PASSPORT-PRESENCE-01)

Revision ID: 20261126_0067
Revises: 20261103_0066

Additive only: seven new tables and ``users.is_test`` (metadata-only default on
PostgreSQL >= 11, no table rewrite). Downgrade drops them in reverse order.
Deploy with ``PRESENCE_VALIDATION_ENABLED=false`` first: the schema then has no effect.
"""

from collections.abc import Sequence
from typing import Any

import sqlalchemy as sa
from alembic import op

revision: str = "20261126_0067"
down_revision: str | None = "20261103_0066"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps() -> list[sa.Column[Any]]:
    return [
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
    ]


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_test", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    op.create_table(
        "presence_campaigns",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("local_event_id", sa.Uuid(), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="draft", nullable=False),
        sa.Column("presence_opens_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("presence_closes_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_test", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        *_timestamps(),
        sa.CheckConstraint(
            "status IN ('draft','open','closed','archived')",
            name="ck_presence_campaigns_status",
        ),
        sa.CheckConstraint(
            "presence_closes_at > presence_opens_at",
            name="ck_presence_campaigns_window",
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["local_event_id"], ["local_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_presence_campaigns_organization_id", "presence_campaigns", ["organization_id"]
    )
    op.create_index(
        "ix_presence_campaigns_local_event_id", "presence_campaigns", ["local_event_id"]
    )
    op.create_index("ix_presence_campaigns_status", "presence_campaigns", ["status"])
    op.create_index(
        "ix_presence_campaigns_created_by_user_id", "presence_campaigns", ["created_by_user_id"]
    )

    op.create_table(
        "presence_registrations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("campaign_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column(
            "status_changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("changed_by_user_id", sa.Uuid(), nullable=True),
        *_timestamps(),
        sa.CheckConstraint(
            "status IN ('confirmed','cancelled')", name="ck_presence_registrations_status"
        ),
        sa.ForeignKeyConstraint(["campaign_id"], ["presence_campaigns.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "campaign_id", "user_id", name="uq_presence_registrations_campaign_user"
        ),
    )
    op.create_index("ix_presence_registrations_user_id", "presence_registrations", ["user_id"])
    op.create_index(
        "ix_presence_registrations_changed_by_user_id",
        "presence_registrations",
        ["changed_by_user_id"],
    )

    op.create_table(
        "presence_agent_assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("campaign_id", sa.Uuid(), nullable=False),
        sa.Column("agent_user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column(
            "status_changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("changed_by_user_id", sa.Uuid(), nullable=True),
        *_timestamps(),
        sa.CheckConstraint(
            "status IN ('active','revoked')", name="ck_presence_agent_assignments_status"
        ),
        sa.ForeignKeyConstraint(["campaign_id"], ["presence_campaigns.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["agent_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "campaign_id",
            "agent_user_id",
            name="uq_presence_agent_assignments_campaign_agent",
        ),
    )
    op.create_index(
        "ix_presence_agent_assignments_agent_user_id",
        "presence_agent_assignments",
        ["agent_user_id"],
    )
    op.create_index(
        "ix_presence_agent_assignments_changed_by_user_id",
        "presence_agent_assignments",
        ["changed_by_user_id"],
    )

    op.create_table(
        "presence_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("passport_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("qr_token_hmac", sa.CHAR(length=64), nullable=False),
        sa.Column("manual_code_hmac", sa.CHAR(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["passport_id"], ["passports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("qr_token_hmac", name="uq_presence_sessions_qr_token_hmac"),
        sa.UniqueConstraint("manual_code_hmac", name="uq_presence_sessions_manual_code_hmac"),
    )
    op.create_index("ix_presence_sessions_passport_id", "presence_sessions", ["passport_id"])
    op.create_index("ix_presence_sessions_user_id", "presence_sessions", ["user_id"])
    op.create_index("ix_presence_sessions_expires_at", "presence_sessions", ["expires_at"])

    op.create_table(
        "presence_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("campaign_id", sa.Uuid(), nullable=False),
        sa.Column("participant_user_id", sa.Uuid(), nullable=False),
        sa.Column("registration_id", sa.Uuid(), nullable=False),
        sa.Column("agent_user_id", sa.Uuid(), nullable=True),
        sa.Column("source", sa.String(length=8), nullable=False),
        sa.Column(
            "validated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("source IN ('scan','manual')", name="ck_presence_records_source"),
        sa.ForeignKeyConstraint(["campaign_id"], ["presence_campaigns.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["participant_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["registration_id"], ["presence_registrations.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["agent_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "campaign_id",
            "participant_user_id",
            name="uq_presence_records_campaign_participant",
        ),
    )
    op.create_index(
        "ix_presence_records_participant_user_id", "presence_records", ["participant_user_id"]
    )
    op.create_index("ix_presence_records_registration_id", "presence_records", ["registration_id"])
    op.create_index("ix_presence_records_agent_user_id", "presence_records", ["agent_user_id"])

    op.create_table(
        "presence_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("campaign_id", sa.Uuid(), nullable=False),
        sa.Column("agent_user_id", sa.Uuid(), nullable=True),
        sa.Column("client_operation_id", sa.Uuid(), nullable=False),
        sa.Column("request_fingerprint", sa.CHAR(length=64), nullable=False),
        sa.Column("participant_user_id", sa.Uuid(), nullable=True),
        sa.Column("presence_id", sa.Uuid(), nullable=True),
        sa.Column("source", sa.String(length=8), nullable=False),
        sa.Column("result", sa.String(length=24), nullable=False),
        sa.Column("reason_code", sa.String(length=48), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("source IN ('scan','manual')", name="ck_presence_operations_source"),
        sa.CheckConstraint(
            "result IN ('posted','already_processed','rejected')",
            name="ck_presence_operations_result",
        ),
        sa.CheckConstraint(
            "result <> 'rejected' OR reason_code IS NOT NULL",
            name="ck_presence_operations_rejected_reason",
        ),
        sa.ForeignKeyConstraint(["campaign_id"], ["presence_campaigns.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["agent_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["participant_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["presence_id"], ["presence_records.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "agent_user_id",
            "client_operation_id",
            name="uq_presence_operations_agent_client_operation",
        ),
    )
    op.create_index("ix_presence_operations_campaign_id", "presence_operations", ["campaign_id"])
    op.create_index(
        "ix_presence_operations_participant_user_id",
        "presence_operations",
        ["participant_user_id"],
    )
    op.create_index("ix_presence_operations_presence_id", "presence_operations", ["presence_id"])
    op.create_index("ix_presence_operations_created_at", "presence_operations", ["created_at"])

    op.create_table(
        "presence_admin_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=48), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("campaign_id", sa.Uuid(), nullable=True),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column("previous_value", sa.String(length=32), nullable=True),
        sa.Column("new_value", sa.String(length=32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["campaign_id"], ["presence_campaigns.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_presence_admin_actions_action", "presence_admin_actions", ["action"])
    op.create_index(
        "ix_presence_admin_actions_actor_user_id", "presence_admin_actions", ["actor_user_id"]
    )
    op.create_index(
        "ix_presence_admin_actions_campaign_id", "presence_admin_actions", ["campaign_id"]
    )
    op.create_index(
        "ix_presence_admin_actions_target_user_id", "presence_admin_actions", ["target_user_id"]
    )


def downgrade() -> None:
    # Reverse dependency order; dropping a table drops its indexes and constraints.
    op.drop_table("presence_admin_actions")
    op.drop_table("presence_operations")
    op.drop_table("presence_records")
    op.drop_table("presence_sessions")
    op.drop_table("presence_agent_assignments")
    op.drop_table("presence_registrations")
    op.drop_table("presence_campaigns")
    op.drop_column("users", "is_test")
