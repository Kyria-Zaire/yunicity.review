"""Allow rate-limited profile username changes."""

import sqlalchemy as sa
from alembic import op

revision = "20260923_0065"
down_revision = "20260912_0064"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("username_changed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "uq_user_profiles_username_lower",
        "user_profiles",
        [sa.text("lower(username)")],
        unique=True,
    )
    op.create_table(
        "user_profile_username_history",
        sa.Column("username", sa.String(length=30), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("retired_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_user_profile_username_history_user_id",
        "user_profile_username_history",
        ["user_id"],
    )
    op.create_index(
        "uq_user_profile_username_history_lower",
        "user_profile_username_history",
        [sa.text("lower(username)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "uq_user_profile_username_history_lower",
        table_name="user_profile_username_history",
    )
    op.drop_index(
        "ix_user_profile_username_history_user_id",
        table_name="user_profile_username_history",
    )
    op.drop_table("user_profile_username_history")
    op.drop_index("uq_user_profiles_username_lower", table_name="user_profiles")
    op.drop_column("user_profiles", "username_changed_at")
