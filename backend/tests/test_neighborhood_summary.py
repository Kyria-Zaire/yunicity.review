"""Unit tests for feed neighborhood summary resolution."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from app.models.local_event import LocalEvent
from app.models.neighborhood import Neighborhood
from app.models.post import Post
from app.services.neighborhood_summary import resolve_feed_neighborhood_summary

pytestmark = pytest.mark.unit  # type: ignore[name-defined]


def test_resolve_from_post_neighborhood() -> None:
    hood = Neighborhood(
        id=uuid.uuid4(),
        city="Reims",
        slug="boulingrin",
        display_name="Boulingrin",
        is_active=True,
    )
    post = Post(
        author_type="citizen",
        author_id=uuid.uuid4(),
        type="post",
        neighborhood=hood,
    )
    summary = resolve_feed_neighborhood_summary(post)
    assert summary is not None
    assert summary.slug == "boulingrin"


def test_resolve_from_event_when_post_has_no_hood() -> None:
    hood = Neighborhood(
        id=uuid.uuid4(),
        city="Reims",
        slug="saint-remi",
        display_name="Saint-Remi",
        is_active=True,
    )
    event = LocalEvent(
        id=uuid.uuid4(),
        created_by_user_id=uuid.uuid4(),
        title="Marché",
        city="Reims",
        starts_at=datetime.now(UTC),
        location_name="Place",
        neighborhood=hood,
    )
    post = Post(
        author_type="organization",
        author_id=uuid.uuid4(),
        type="event",
        local_event=event,
    )
    summary = resolve_feed_neighborhood_summary(post)
    assert summary is not None
    assert summary.slug == "saint-remi"


def test_inactive_neighborhood_returns_none() -> None:
    hood = Neighborhood(
        id=uuid.uuid4(),
        city="Reims",
        slug="hidden",
        display_name="Hidden",
        is_active=False,
    )
    post = Post(author_type="citizen", author_id=uuid.uuid4(), type="post", neighborhood=hood)
    assert resolve_feed_neighborhood_summary(post) is None
