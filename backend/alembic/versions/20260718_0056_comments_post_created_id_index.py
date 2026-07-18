"""add composite index comments(post_id, created_at, id) (DB-INDEX-01)

Revision ID: 20260718_0056
Revises: 20260718_0055

comments carries separate indexes on post_id and user_id, but every read path filters on
post_id and then orders or aggregates on created_at:

  - CommentRepository.list_for_post          ORDER BY created_at, id  (keyset pagination)
  - CommentRepository.latest_activity_by_post GROUP BY post_id, MAX(created_at)
  - CommentRepository.recent_participants_by_post ORDER BY post_id, created_at DESC

The last two run on the feed, once per batch of posts.

Measured on 120k rows locally, reading the first page of a post carrying 20k comments:

  no composite index          Sort (top-N heapsort) over 19k rows     5.31 ms
  (post_id, created_at)       residual incremental sort on id         1.29 ms
  (post_id, created_at, id)   Index Scan, no Sort node at all         0.11 ms

The third column is what removes the sort entirely: the order by is on the (created_at, id)
tuple, not on created_at alone.

Production currently holds 5 comments, so this changes nothing measurable today. It is
added now because it is free at this size and would not be later.

ix_comments_post_id is left in place. The composite makes it redundant by prefix, but
dropping an index is a separate decision and does not belong in an additive migration.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260718_0056"
down_revision: str | None = "20260718_0055"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_INDEX_NAME = "ix_comments_post_id_created_at_id"


def upgrade() -> None:
    # Plain CREATE INDEX rather than CONCURRENTLY: the table holds 5 rows in production, so
    # the write lock is not observable, and CONCURRENTLY would require an autocommit block.
    # Revisit if comments ever reaches millions of rows.
    op.execute(f"CREATE INDEX IF NOT EXISTS {_INDEX_NAME} ON comments (post_id, created_at, id)")


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_INDEX_NAME}")
