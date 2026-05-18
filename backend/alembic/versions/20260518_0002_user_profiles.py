"""user profiles foundation

Revision ID: 20260518_0002
Revises: 20260517_0001
Create Date: 2026-05-18

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from app.core.profile_username import pick_available_username_sync

revision: str = "20260518_0002"
down_revision: str | None = "20260517_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=30), nullable=False),
        sa.Column("display_name", sa.String(length=128), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(length=2048), nullable=True),
        sa.Column("banner_url", sa.String(length=2048), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=True),
        sa.Column(
            "interests",
            sa.dialects.postgresql.JSONB(),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "visibility",
            sa.String(length=16),
            server_default="public",
            nullable=False,
        ),
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("onboarding_step", sa.String(length=64), nullable=True),
        sa.Column("preferred_language", sa.String(length=8), nullable=True),
        sa.Column(
            "notification_preferences",
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
        sa.UniqueConstraint("username", name="uq_user_profiles_username"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)
    op.create_index("ix_user_profiles_username", "user_profiles", ["username"], unique=True)

    connection = op.get_bind()
    users = connection.execute(
        sa.text("SELECT id, email, full_name, city FROM users ORDER BY created_at")
    ).fetchall()
    taken: set[str] = set()
    now = datetime.now(UTC)
    for row in users:
        user_id = row.id if isinstance(row.id, uuid.UUID) else uuid.UUID(str(row.id))
        username = pick_available_username_sync(
            taken,
            full_name=row.full_name,
            email=row.email,
            user_id=user_id,
        )
        display_name = (row.full_name or "").strip() or None
        city = row.city.strip() if row.city and row.city.strip() else None
        connection.execute(
            sa.text(
                """
                INSERT INTO user_profiles (
                    id, user_id, username, display_name, city, interests, visibility,
                    onboarding_completed, onboarding_step, preferred_language,
                    notification_preferences, created_at, updated_at
                ) VALUES (
                    :id, :user_id, :username, :display_name, :city, '[]'::jsonb,
                    'public', false, 'city', 'fr', '{}'::jsonb, :created_at, :updated_at
                )
                """
            ),
            {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "username": username,
                "display_name": display_name,
                "city": city,
                "created_at": now,
                "updated_at": now,
            },
        )


def downgrade() -> None:
    op.drop_index("ix_user_profiles_username", table_name="user_profiles")
    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")
