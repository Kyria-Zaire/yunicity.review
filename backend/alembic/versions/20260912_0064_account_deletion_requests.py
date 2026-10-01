"""Account deletion grace period (AUTH-02A).

Strictement ADDITIVE : trois colonnes nullables sur `users` et une table neuve.

Aucun `DROP`, aucune contrainte modifiee, aucune cascade touchee, aucun backfill.
Les comptes existants restent tels quels — les trois colonnes valent NULL, ce qui
signifie « aucune suppression demandee », l'etat de tout le monde aujourd'hui.

En particulier, `ondelete=CASCADE` sur `account_deletion_tokens.user_id` ne
concerne que cette table neuve : il n'etend aucune suppression a des donnees
existantes, et AUCUNE purge n'est declenchee par cette revision.

Revision ID: 20260912_0064
Revises: 20260911_0063
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260912_0064"
down_revision: str | None = "20260911_0063"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Distinct de `is_active`, qui porte la suspension administrative : un
    # administrateur doit pouvoir reactiver un compte suspendu sans effacer la
    # demande de suppression de son titulaire, et reciproquement.
    op.add_column(
        "users",
        sa.Column("deletion_requested_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("deletion_scheduled_for", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("deletion_cancelled_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "account_deletion_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_account_deletion_tokens_token_hash"),
    )
    op.create_index(
        "ix_account_deletion_tokens_user_id",
        "account_deletion_tokens",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_account_deletion_tokens_token_hash",
        "account_deletion_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_account_deletion_tokens_expires_at",
        "account_deletion_tokens",
        ["expires_at"],
        unique=False,
    )
    # Les demandes en cours se lisent par ce chemin : un index partiel evite de
    # parcourir toute la table `users` pour les retrouver.
    op.create_index(
        "ix_users_deletion_requested_at",
        "users",
        ["deletion_requested_at"],
        unique=False,
        postgresql_where=sa.text("deletion_requested_at IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_users_deletion_requested_at", table_name="users")
    op.drop_index("ix_account_deletion_tokens_expires_at", table_name="account_deletion_tokens")
    op.drop_index("ix_account_deletion_tokens_token_hash", table_name="account_deletion_tokens")
    op.drop_index("ix_account_deletion_tokens_user_id", table_name="account_deletion_tokens")
    op.drop_table("account_deletion_tokens")
    op.drop_column("users", "deletion_cancelled_at")
    op.drop_column("users", "deletion_scheduled_for")
    op.drop_column("users", "deletion_requested_at")
