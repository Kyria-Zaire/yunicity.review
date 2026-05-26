"""Grand Reims transit GTFS tables (WEB-MAP-02).

Revision ID: 20260602_0019
Revises: 20260601_0018
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260602_0019"
down_revision: str | None = "20260601_0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "transit_stops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("external_stop_id", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("city", sa.String(128), nullable=False, server_default="Reims"),
        sa.UniqueConstraint("external_stop_id", name="uq_transit_stops_external_stop_id"),
    )
    op.create_index("ix_transit_stops_city", "transit_stops", ["city"])
    op.create_index("ix_transit_stops_lat_lon", "transit_stops", ["latitude", "longitude"])

    op.create_table(
        "transit_departures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "stop_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transit_stops.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("route_short_name", sa.String(32), nullable=False),
        sa.Column("route_type", sa.String(16), nullable=False),
        sa.Column("headsign", sa.String(255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("realtime", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(
        "ix_transit_departures_stop_scheduled",
        "transit_departures",
        ["stop_id", "scheduled_at"],
    )

    op.create_table(
        "transit_feed_meta",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source", sa.String(64), nullable=False),
        sa.Column("mode", sa.String(16), nullable=False),
        sa.Column("gtfs_url", sa.Text(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=True),
        sa.Column("valid_to", sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("transit_feed_meta")
    op.drop_index("ix_transit_departures_stop_scheduled", table_name="transit_departures")
    op.drop_table("transit_departures")
    op.drop_index("ix_transit_stops_lat_lon", table_name="transit_stops")
    op.drop_index("ix_transit_stops_city", table_name="transit_stops")
    op.drop_table("transit_stops")
