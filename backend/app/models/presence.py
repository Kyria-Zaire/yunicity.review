"""Presence validation by assigned agent (PASSPORT-PRESENCE-01, ADR § 3).

Isolated domain: no relationship to rewards, Yunimoney, reputation, challenges or stamps.
Credentials (QR token, manual code) are never stored in clear, only as peppered HMACs.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CHAR,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models._mixins import CreatedAtMixin, TimestampMixin


class PresenceCampaign(TimestampMixin, Base):
    __tablename__ = "presence_campaigns"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','open','closed','archived')",
            name="ck_presence_campaigns_status",
        ),
        CheckConstraint(
            "presence_closes_at > presence_opens_at",
            name="ck_presence_campaigns_window",
        ),
        Index("ix_presence_campaigns_organization_id", "organization_id"),
        Index("ix_presence_campaigns_local_event_id", "local_event_id"),
        Index("ix_presence_campaigns_status", "status"),
        Index("ix_presence_campaigns_created_by_user_id", "created_by_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False
    )
    local_event_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("local_events.id", ondelete="SET NULL"), nullable=True
    )
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="draft", server_default="draft"
    )
    presence_opens_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    presence_closes_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_test: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class PresenceRegistration(TimestampMixin, Base):
    """Minimal administrative registration (B3), separate from the public PILOT-04 flow."""

    __tablename__ = "presence_registrations"
    __table_args__ = (
        CheckConstraint(
            "status IN ('confirmed','cancelled')",
            name="ck_presence_registrations_status",
        ),
        UniqueConstraint("campaign_id", "user_id", name="uq_presence_registrations_campaign_user"),
        Index("ix_presence_registrations_user_id", "user_id"),
        Index("ix_presence_registrations_changed_by_user_id", "changed_by_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("presence_campaigns.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    status_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class PresenceAgentAssignment(TimestampMixin, Base):
    """Per-campaign agent assignment; there is no global agent role (ADR § 5)."""

    __tablename__ = "presence_agent_assignments"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active','revoked')",
            name="ck_presence_agent_assignments_status",
        ),
        UniqueConstraint(
            "campaign_id", "agent_user_id", name="uq_presence_agent_assignments_campaign_agent"
        ),
        Index("ix_presence_agent_assignments_agent_user_id", "agent_user_id"),
        Index("ix_presence_agent_assignments_changed_by_user_id", "changed_by_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("presence_campaigns.id", ondelete="RESTRICT"), nullable=False
    )
    agent_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    status_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class PresenceSession(CreatedAtMixin, Base):
    """Ephemeral participant session (TTL 60 s). Only peppered HMACs are stored."""

    __tablename__ = "presence_sessions"
    __table_args__ = (
        UniqueConstraint("qr_token_hmac", name="uq_presence_sessions_qr_token_hmac"),
        UniqueConstraint("manual_code_hmac", name="uq_presence_sessions_manual_code_hmac"),
        Index("ix_presence_sessions_passport_id", "passport_id"),
        Index("ix_presence_sessions_user_id", "user_id"),
        Index("ix_presence_sessions_expires_at", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    passport_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("passports.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    qr_token_hmac: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    manual_code_hmac: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PresenceRecord(Base):
    """A validated presence. Immutable; at most one per (campaign, participant)."""

    __tablename__ = "presence_records"
    __table_args__ = (
        CheckConstraint("source IN ('scan','manual')", name="ck_presence_records_source"),
        UniqueConstraint(
            "campaign_id", "participant_user_id", name="uq_presence_records_campaign_participant"
        ),
        Index("ix_presence_records_participant_user_id", "participant_user_id"),
        Index("ix_presence_records_registration_id", "registration_id"),
        Index("ix_presence_records_agent_user_id", "agent_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("presence_campaigns.id", ondelete="RESTRICT"), nullable=False
    )
    participant_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    registration_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("presence_registrations.id", ondelete="RESTRICT"), nullable=False
    )
    agent_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(8), nullable=False)
    validated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PresenceOperation(CreatedAtMixin, Base):
    """Append-only validation audit and idempotency record.

    ``uncertain`` is a client-only state and never stored. A server failure leaves no row.
    """

    __tablename__ = "presence_operations"
    __table_args__ = (
        CheckConstraint("source IN ('scan','manual')", name="ck_presence_operations_source"),
        CheckConstraint(
            "result IN ('posted','already_processed','rejected')",
            name="ck_presence_operations_result",
        ),
        CheckConstraint(
            "result <> 'rejected' OR reason_code IS NOT NULL",
            name="ck_presence_operations_rejected_reason",
        ),
        UniqueConstraint(
            "agent_user_id",
            "client_operation_id",
            name="uq_presence_operations_agent_client_operation",
        ),
        Index("ix_presence_operations_campaign_id", "campaign_id"),
        Index("ix_presence_operations_participant_user_id", "participant_user_id"),
        Index("ix_presence_operations_presence_id", "presence_id"),
        Index("ix_presence_operations_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("presence_campaigns.id", ondelete="RESTRICT"), nullable=False
    )
    #: Always set on insert; nullable only so that deleting an agent keeps the audit.
    agent_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    client_operation_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    request_fingerprint: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    participant_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    presence_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("presence_records.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(8), nullable=False)
    result: Mapped[str] = mapped_column(String(24), nullable=False)
    reason_code: Mapped[str | None] = mapped_column(String(48), nullable=True)


class PresenceAdminAction(CreatedAtMixin, Base):
    """Staff audit trail (ADMIN-03B pattern). Never holds a credential or PII value."""

    __tablename__ = "presence_admin_actions"
    __table_args__ = (
        Index("ix_presence_admin_actions_action", "action"),
        Index("ix_presence_admin_actions_actor_user_id", "actor_user_id"),
        Index("ix_presence_admin_actions_campaign_id", "campaign_id"),
        Index("ix_presence_admin_actions_target_user_id", "target_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    action: Mapped[str] = mapped_column(String(48), nullable=False)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("presence_campaigns.id", ondelete="SET NULL"), nullable=True
    )
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    previous_value: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_value: Mapped[str | None] = mapped_column(String(32), nullable=True)
