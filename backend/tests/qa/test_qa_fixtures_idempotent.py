"""Idempotence test for QA fixtures (C3-F0-T1).

Requires a migrated ``yunicity_qa`` schema reachable via ``TEST_DATABASE_URL``.
Skipped when that env is absent (e.g. plain unit-test runs) so it never touches
an unintended database. The guard is invoked first, so a mis-pointed target
fail-closes instead of mutating it.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from app.db.base import Base
from app.db.search_fts import install_search_fts
from app.db.seeds.qa_fixtures import EXPECTED_VOLUMES, seed_qa_fixtures
from app.db.seeds.qa_video_media import (
    QA_LANDSCAPE_DURATION_SECONDS,
    QA_LANDSCAPE_HEIGHT,
    QA_LANDSCAPE_WIDTH,
    QA_PORTRAIT_DURATION_SECONDS,
    QA_PORTRAIT_HEIGHT,
    QA_PORTRAIT_WIDTH,
)
from app.models.local_event import EventInterest, LocalEvent
from app.models.local_video import LocalVideo
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer, Passport
from app.models.post import Post
from app.models.tribe import Tribe, TribeMember
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_profile import UserProfile
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tests.qa_support import resolve_destructive_qa_url

_FIXED_NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)

_COUNT_MODELS: dict[str, type] = {
    "users": User,
    "profiles": UserProfile,
    "tribes": Tribe,
    "tribe_members": TribeMember,
    "posts": Post,
    "events": LocalEvent,
    "event_interests": EventInterest,
    "organizations": Organization,
    "partner_profiles": PartnerProfile,
    "partner_offers": PartnerOffer,
    "local_videos": LocalVideo,
    "notifications": UserNotification,
    "passports": Passport,
}


def _reset_schema(connection) -> None:  # type: ignore[no-untyped-def]
    """Rebuild an empty schema so volume assertions are order-independent in the full suite."""
    table_names = ", ".join(f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables))
    if table_names:
        connection.execute(text(f"DROP TABLE IF EXISTS {table_names} CASCADE"))
    Base.metadata.create_all(connection)


@pytest.fixture
async def qa_session() -> AsyncGenerator[AsyncSession, None]:
    # Fail-closed guard (QA target only), then a clean isolated schema for this test.
    test_url = resolve_destructive_qa_url()
    engine = create_async_engine(test_url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(_reset_schema)
        await connection.run_sync(install_search_fts)
    maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


async def test_second_seed_creates_nothing_and_volumes_match(qa_session: AsyncSession) -> None:
    # First seed may create (fresh schema) or skip (already seeded).
    await seed_qa_fixtures(qa_session, reference_now=_FIXED_NOW)

    # Second seed with the same reference must create strictly nothing.
    second = await seed_qa_fixtures(qa_session, reference_now=_FIXED_NOW)
    assert sum(second.counts.values()) == 0, f"reseed duplicated rows: {second.counts}"

    # Volumes are exactly the expected deterministic dataset.
    for key, model in _COUNT_MODELS.items():
        result = await qa_session.execute(select(func.count()).select_from(model))
        assert int(result.scalar_one()) == EXPECTED_VOLUMES[key], f"volume mismatch for {key}"


async def test_local_video_fixture_api_metadata_matches_media_contract(
    qa_session: AsyncSession,
) -> None:
    await seed_qa_fixtures(qa_session, reference_now=_FIXED_NOW)
    result = await qa_session.execute(select(LocalVideo))
    videos = {row.title: row for row in result.scalars().all() if row.title}

    landscape = videos.get("QA Vidéo locale")
    portrait = videos.get("3 adresses à tester ce week-end à Reims")
    assert landscape is not None
    assert portrait is not None

    assert landscape.media_width == QA_LANDSCAPE_WIDTH
    assert landscape.media_height == QA_LANDSCAPE_HEIGHT
    assert landscape.duration_seconds == QA_LANDSCAPE_DURATION_SECONDS

    assert portrait.media_width == QA_PORTRAIT_WIDTH
    assert portrait.media_height == QA_PORTRAIT_HEIGHT
    assert portrait.duration_seconds == QA_PORTRAIT_DURATION_SECONDS
