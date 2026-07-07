"""Scheduled-post auto-publication tests (FEED-SCHED-01)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.db.session import get_session_factory
from app.models.post import Post
from app.services.scheduled_post_service import publish_due_scheduled_posts
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _insert_post(
    *,
    is_active: bool,
    scheduled_at: datetime | None,
    scheduled_published_at: datetime | None = None,
    body: str = "Post programmé",
) -> uuid.UUID:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        post = Post(
            author_type="citizen",
            author_id=uuid.uuid4(),
            type="post",
            city="Reims",
            body=body,
            is_active=is_active,
            scheduled_at=scheduled_at,
            scheduled_published_at=scheduled_published_at,
        )
        session.add(post)
        await session.commit()
        return post.id


async def _get_post(post_id: uuid.UUID) -> Post:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        post = await session.get(Post, post_id)
        assert post is not None
        return post


async def _run(now: datetime | None = None) -> list[uuid.UUID]:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        return await publish_due_scheduled_posts(session, now=now)


@pytest.mark.asyncio
async def test_publishes_post_whose_time_has_come(auth_client: AsyncClient) -> None:
    now = datetime.now(UTC)
    post_id = await _insert_post(is_active=False, scheduled_at=now - timedelta(minutes=1))

    published = await _run(now=now)

    assert post_id in published
    post = await _get_post(post_id)
    assert post.is_active is True
    assert post.scheduled_published_at is not None


@pytest.mark.asyncio
async def test_does_not_publish_future_post(auth_client: AsyncClient) -> None:
    now = datetime.now(UTC)
    post_id = await _insert_post(is_active=False, scheduled_at=now + timedelta(hours=1))

    published = await _run(now=now)

    assert published == []
    post = await _get_post(post_id)
    assert post.is_active is False
    assert post.scheduled_published_at is None


@pytest.mark.asyncio
async def test_does_not_republish_post_deleted_after_publication(
    auth_client: AsyncClient,
) -> None:
    now = datetime.now(UTC)
    # Already published earlier (scheduled_published_at set), then soft-deleted
    # (is_active back to False). It must never be republished.
    post_id = await _insert_post(
        is_active=False,
        scheduled_at=now - timedelta(hours=2),
        scheduled_published_at=now - timedelta(hours=1),
    )

    published = await _run(now=now)

    assert post_id not in published
    post = await _get_post(post_id)
    assert post.is_active is False


@pytest.mark.asyncio
async def test_catches_up_all_overdue_posts_after_downtime(auth_client: AsyncClient) -> None:
    now = datetime.now(UTC)
    # Simulate a worker that was down: several posts became due meanwhile.
    overdue_ids = [
        await _insert_post(
            is_active=False,
            scheduled_at=now - timedelta(minutes=m),
            body=f"En retard {m}",
        )
        for m in (30, 10, 2)
    ]
    future_id = await _insert_post(is_active=False, scheduled_at=now + timedelta(minutes=5))

    published = await _run(now=now)

    assert set(overdue_ids) == set(published)
    assert future_id not in published
    for pid in overdue_ids:
        assert (await _get_post(pid)).is_active is True


@pytest.mark.asyncio
async def test_run_is_idempotent(auth_client: AsyncClient) -> None:
    now = datetime.now(UTC)
    post_id = await _insert_post(is_active=False, scheduled_at=now - timedelta(minutes=1))

    first = await _run(now=now)
    second = await _run(now=now)

    assert post_id in first
    assert second == []
