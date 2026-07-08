"""Composer post creation must enforce linked_tribe_id membership (FEED-COMPOSER-TRIBE)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

import pytest
from app.db.session import get_session_factory
from app.integrations.redis import get_redis_client
from app.models.tribe import Tribe, TribeMember
from httpx import AsyncClient

from tests.conftest_passport import auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _make_tribe(*, created_by: uuid.UUID, member_ids: list[uuid.UUID]) -> uuid.UUID:
    factory = get_session_factory()
    assert factory is not None
    now = datetime.now(UTC)
    async with factory() as session:
        tribe = Tribe(
            slug=f"tribe-{uuid.uuid4().hex[:8]}",
            name="Tribu test",
            description="Tribu de test",
            city="Reims",
            category="general",
            visibility="private",
            created_by_user_id=created_by,
        )
        session.add(tribe)
        await session.flush()
        for uid in member_ids:
            session.add(
                TribeMember(
                    tribe_id=tribe.id,
                    user_id=uid,
                    role="member",
                    joined_at=now,
                    charter_accepted_at=now,
                )
            )
        await session.commit()
        return tribe.id


async def _create_post(client: AsyncClient, token: str, linked_tribe_id: uuid.UUID) -> Any:
    return await client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Post lié à une tribu",
            "linked_tribe_id": str(linked_tribe_id),
        },
        headers=auth_header(token),
    )


@pytest.mark.asyncio
async def test_member_can_link_post_to_tribe(auth_client: AsyncClient) -> None:
    author = await register_user(auth_client, suffix="-tribe-member")
    author_id = uuid.UUID(author["user"]["id"])
    tribe_id = await _make_tribe(created_by=author_id, member_ids=[author_id])

    response = await _create_post(auth_client, author["access_token"], tribe_id)

    assert response.status_code == 201, response.text
    assert response.json()["composer"]["linked_tribe_id"] == str(tribe_id)


@pytest.mark.asyncio
async def test_non_member_cannot_link_post_to_tribe(auth_client: AsyncClient) -> None:
    owner = await register_user(auth_client, suffix="-tribe-owner")
    outsider = await register_user(auth_client, suffix="-tribe-outsider")
    owner_id = uuid.UUID(owner["user"]["id"])
    # Tribe owned by owner; outsider is not a member.
    tribe_id = await _make_tribe(created_by=owner_id, member_ids=[owner_id])

    response = await _create_post(auth_client, outsider["access_token"], tribe_id)

    assert response.status_code == 403, response.text
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_nonexistent_tribe_returns_404_not_500(auth_client: AsyncClient) -> None:
    author = await register_user(auth_client, suffix="-tribe-ghost")

    response = await _create_post(auth_client, author["access_token"], uuid.uuid4())

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "TRIBE_NOT_FOUND"
