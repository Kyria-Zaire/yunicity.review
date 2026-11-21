"""post client request id (FEED-NEW-UX-01)

Revision ID: 20261103_0066
Revises: 20260923_0065
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261103_0066"
down_revision: str | None = "20260923_0065"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("posts", sa.Column("client_request_id", sa.Uuid(), nullable=True))
    op.add_column(
        "posts",
        sa.Column("client_request_fingerprint", sa.String(length=64), nullable=True),
    )
    # PostgreSQL traite chaque NULL comme distinct : les publications
    # existantes (toutes NULL) passent sans remplissage retroactif.
    # La cle est scopee a l'auteur -- jamais un index unique global, sinon la
    # cle d'un compte bloquerait celle d'un autre.
    op.create_index(
        "uq_posts_author_client_request",
        "posts",
        ["author_id", "client_request_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_posts_author_client_request", table_name="posts")
    op.drop_column("posts", "client_request_fingerprint")
    op.drop_column("posts", "client_request_id")
