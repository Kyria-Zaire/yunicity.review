"""Neighborhood citizen contributions API tests (FEATURE-QUARTIERS-V2 / Q2-S3-01)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.neighborhood_v2_constants import (
    NEIGHBORHOOD_CONTRIBUTION_SUBMIT_SUCCESS_MESSAGE,
    NeighborhoodContributionStatus,
)
from app.db.session import get_session_factory
from app.integrations.redis import get_redis_client
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodContribution
from httpx import AsyncClient
from sqlalchemy import select

from tests.conftest_passport import activate_passport, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/neighborhoods"
VALID_BODY = (
    "Quand j'étais petit, mon grand-père m'emmenait aux Halles tous les samedis matin."
)
PSEUDO_LABEL = "Passport Citizen"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _register(auth_client: AsyncClient) -> dict[str, Any]:
    return await register_user(auth_client, suffix=f"-nc-{uuid.uuid4().hex[:8]}")


def _submit_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "identity_type": "PSEUDO",
        "body": VALID_BODY,
    }
    payload.update(overrides)
    return payload


async def _hood_id(slug: str) -> uuid.UUID:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        hood = (
            await session.execute(
                select(Neighborhood).where(
                    Neighborhood.city == "Reims",
                    Neighborhood.slug == slug,
                )
            )
        ).scalar_one()
        return hood.id


async def _seed_recent_approved(
    *,
    author_user_id: uuid.UUID,
    neighborhood_slug: str,
    days_ago: int = 5,
) -> None:
    factory = get_session_factory()
    assert factory is not None
    hood_id = await _hood_id(neighborhood_slug)
    async with factory() as session:
        approved_at = datetime.now(UTC) - timedelta(days=days_ago)
        session.add(
            NeighborhoodContribution(
                neighborhood_id=hood_id,
                author_user_id=author_user_id,
                body=VALID_BODY,
                status=NeighborhoodContributionStatus.APPROVED.value,
                display_identity_type="pseudo",
                display_identity_label="Kyria",
                passport_verified_snapshot=False,
                submitted_at=approved_at,
                approved_at=approved_at,
            )
        )
        await session.commit()


@pytest.mark.asyncio
async def test_submit_contribution_success(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(title="Les Halles le samedi"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "pending"
    assert body["message"] == NEIGHBORHOOD_CONTRIBUTION_SUBMIT_SUCCESS_MESSAGE
    assert body["submitted_at"]


@pytest.mark.asyncio
async def test_submit_contribution_identity_snapshot_pseudo(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(identity_type="PSEUDO"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    contribution_id = uuid.UUID(response.json()["id"])

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        row = await session.get(NeighborhoodContribution, contribution_id)
        assert row is not None
        assert row.display_identity_type == "pseudo"
        assert row.display_identity_label == PSEUDO_LABEL
        assert row.passport_verified_snapshot is False


@pytest.mark.asyncio
async def test_submit_contribution_identity_snapshot_anonymous(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(identity_type="ANONYMOUS", anonymous_gender="remoise"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    contribution_id = uuid.UUID(response.json()["id"])

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        row = await session.get(NeighborhoodContribution, contribution_id)
        assert row is not None
        assert row.display_identity_type == "anonymous"
        assert row.display_identity_label == "Une Rémoise"
        assert row.passport_verified_snapshot is False


@pytest.mark.asyncio
async def test_submit_contribution_identity_snapshot_verified(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    await activate_passport(auth_client, user["access_token"], city="Reims")
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(identity_type="VERIFIED"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    contribution_id = uuid.UUID(response.json()["id"])

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        row = await session.get(NeighborhoodContribution, contribution_id)
        assert row is not None
        assert row.display_identity_type == "verified"
        assert row.display_identity_label == f"{PSEUDO_LABEL} • Citoyen vérifié"
        assert row.passport_verified_snapshot is True


@pytest.mark.asyncio
async def test_submit_contribution_pending_conflict_across_neighborhoods(
    auth_client: AsyncClient,
) -> None:
    user = await _register(auth_client)
    headers = auth_header(user["access_token"])
    first = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(),
        headers=headers,
    )
    assert first.status_code == 201, first.text

    second = await auth_client.post(
        f"{BASE}/centre-ville/contributions",
        params={"city": "Reims"},
        json=_submit_payload(body=VALID_BODY + " Un autre souvenir pour tester."),
        headers=headers,
    )
    assert second.status_code == 409, second.text
    assert second.json()["code"] == "CONTRIBUTION_PENDING_EXISTS"


@pytest.mark.asyncio
async def test_submit_contribution_quota_conflict(auth_client: AsyncClient) -> None:
    user_data = await _register(auth_client)
    token = user_data["access_token"]
    author_id = uuid.UUID(str(user_data["user"]["id"]))
    await _seed_recent_approved(author_user_id=author_id, neighborhood_slug="boulingrin")

    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(),
        headers=auth_header(token),
    )
    assert response.status_code == 409, response.text
    assert response.json()["code"] == "CONTRIBUTION_QUOTA_EXCEEDED"


@pytest.mark.asyncio
async def test_submit_contribution_unknown_neighborhood(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/quartier-inexistant/contributions",
        params={"city": "Reims"},
        json=_submit_payload(),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 404, response.text
    assert response.json()["code"] == "NEIGHBORHOOD_NOT_FOUND"


@pytest.mark.asyncio
async def test_submit_contribution_body_validation(auth_client: AsyncClient) -> None:
    user = await _register(auth_client)
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(body="trop court"),
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 400, response.text
    assert response.json()["code"] == "CONTRIBUTION_BODY_TOO_SHORT"


@pytest.mark.asyncio
async def test_submit_contribution_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(),
    )
    assert response.status_code == 401
