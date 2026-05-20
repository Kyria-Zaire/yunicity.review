"""Local events foundation & event interests (TICKET-505).

Revision ID: 20260527_0013
Revises: 20260526_0012
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260527_0013"
down_revision: str | None = "20260526_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "local_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("district", sa.String(length=128), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "timezone",
            sa.String(length=64),
            nullable=False,
            server_default="Europe/Paris",
        ),
        sa.Column("location_name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column(
            "visibility",
            sa.String(length=32),
            nullable=False,
            server_default="public",
        ),
        sa.Column(
            "moderation_status",
            sa.String(length=32),
            nullable=False,
            server_default="pending_review",
        ),
        sa.Column("moderated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default="false"),
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
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["moderated_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_local_events_city_starts_at", "local_events", ["city", "starts_at"])
    op.create_index("ix_local_events_organization_id", "local_events", ["organization_id"])
    op.create_index(
        "ix_local_events_moderation_starts",
        "local_events",
        ["moderation_status", "starts_at"],
    )

    op.create_table(
        "event_interests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
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
        sa.ForeignKeyConstraint(["event_id"], ["local_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "event_id", name="uq_event_interests_user_event"),
    )
    op.create_index("ix_event_interests_user_id", "event_interests", ["user_id"])
    op.create_index("ix_event_interests_event_id", "event_interests", ["event_id"])

    op.add_column(
        "posts",
        sa.Column("local_event_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_posts_local_event_id",
        "posts",
        "local_events",
        ["local_event_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_posts_local_event_id", "posts", ["local_event_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_posts_local_event_id", table_name="posts")
    op.drop_constraint("fk_posts_local_event_id", "posts", type_="foreignkey")
    op.drop_column("posts", "local_event_id")
    op.drop_index("ix_event_interests_event_id", table_name="event_interests")
    op.drop_index("ix_event_interests_user_id", table_name="event_interests")
    op.drop_table("event_interests")
    op.drop_index("ix_local_events_moderation_starts", table_name="local_events")
    op.drop_index("ix_local_events_organization_id", table_name="local_events")
    op.drop_index("ix_local_events_city_starts_at", table_name="local_events")
    op.drop_table("local_events")
