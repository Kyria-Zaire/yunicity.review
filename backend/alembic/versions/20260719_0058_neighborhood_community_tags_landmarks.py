"""neighborhood community tags and landmarks (QUARTIER-01 phase 3a)

Revision ID: 20260719_0058
Revises: 20260719_0057

Two concepts, three tables.

Community tags mirror the neighborhood_mood_tags pair already in place: a catalog of tags,
plus an ordered assignment per district. Tribe suggestions are resolved at read time — a tag
feeds a search by tribe category or name — rather than stored as a hard link, because tribes
are created by users and would leave dangling rows.

Landmarks are a join table onto cultural_places rather than a flag on that table. It lets the
selection be curated and ordered, and lets a place be emblematic of a district it does not
administratively belong to — a real case here: Porte de Paris sits in the centre by OSM's
boundaries but belongs to Courlancy editorially.

ON DELETE CASCADE on neighborhood_id: an assignment or a landmark has no meaning without its
district. ON DELETE CASCADE on cultural_place_id for the same reason.

Idempotent: IF NOT EXISTS throughout, so a partial run can be replayed.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260719_0058"
down_revision: str | None = "20260719_0057"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS neighborhood_community_tags (
            slug  VARCHAR(32) PRIMARY KEY,
            label VARCHAR(64) NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS neighborhood_community_tag_assignments (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            neighborhood_id UUID NOT NULL REFERENCES neighborhoods (id) ON DELETE CASCADE,
            tag_slug        VARCHAR(32) NOT NULL
                            REFERENCES neighborhood_community_tags (slug) ON DELETE CASCADE,
            sort_order      INTEGER NOT NULL DEFAULT 0,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_neighborhood_community_tag_hood_tag
                UNIQUE (neighborhood_id, tag_slug)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_neighborhood_community_tag_assignments_neighborhood_id
        ON neighborhood_community_tag_assignments (neighborhood_id)
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS neighborhood_landmarks (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            neighborhood_id   UUID NOT NULL REFERENCES neighborhoods (id) ON DELETE CASCADE,
            cultural_place_id UUID NOT NULL REFERENCES cultural_places (id) ON DELETE CASCADE,
            sort_order        INTEGER NOT NULL DEFAULT 0,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_neighborhood_landmarks_hood_place
                UNIQUE (neighborhood_id, cultural_place_id)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_neighborhood_landmarks_neighborhood_id
        ON neighborhood_landmarks (neighborhood_id)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS neighborhood_landmarks")
    op.execute("DROP TABLE IF EXISTS neighborhood_community_tag_assignments")
    op.execute("DROP TABLE IF EXISTS neighborhood_community_tags")
