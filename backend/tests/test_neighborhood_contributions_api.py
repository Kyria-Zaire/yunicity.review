"""Neighborhood citizen contributions API tests (FEATURE-QUARTIERS-V2 / Q2-S3-01+02)."""

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
from tests.conftest_rbac import RbacUserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/neighborhoods"
ADMIN_BASE = "/api/v1/admin/neighborhood-contributions"
ME_BASE = "/api/v1/me/neighborhood-contributions"
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


async def _submit_pending(
    auth_client: AsyncClient,
    token: str,
    *,
    slug: str = "boulingrin",
) -> uuid.UUID:
    response = await auth_client.post(
        f"{BASE}/{slug}/contributions",
        params={"city": "Reims"},
        json=_submit_payload(),
        headers=auth_header(token),
    )
    assert response.status_code == 201, response.text
    return uuid.UUID(response.json()["id"])


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


@pytest.mark.asyncio
async def test_approve_contribution_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "approved"
    assert body["approved_at"] is not None
    assert body["reviewed_at"] is not None
    assert body["reviewed_by_user_id"] == str(moderator.user_id)
    assert body["rejection_reason_code"] is None


@pytest.mark.asyncio
async def test_reject_contribution_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "NOT_A_MEMORY", "note": "Formulation type avis"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "rejected"
    assert body["approved_at"] is None
    assert body["rejection_reason_code"] == "NOT_A_MEMORY"
    assert body["rejection_note"] == "Formulation type avis"


@pytest.mark.asyncio
async def test_approve_already_reviewed_returns_409(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    first = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert first.status_code == 200, first.text

    second = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert second.status_code == 409, second.text
    assert second.json()["code"] == "CONTRIBUTION_ALREADY_REVIEWED"


@pytest.mark.asyncio
async def test_reject_already_reviewed_returns_409(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    first = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "OTHER"},
        headers=auth_header(moderator.access_token),
    )
    assert first.status_code == 200, first.text

    second = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "OTHER"},
        headers=auth_header(moderator.access_token),
    )
    assert second.status_code == 409, second.text
    assert second.json()["code"] == "CONTRIBUTION_ALREADY_REVIEWED"


@pytest.mark.asyncio
async def test_approve_unauthorized_returns_403(
    auth_client: AsyncClient,
) -> None:
    citizen = await _register(auth_client)
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 403, response.text


@pytest.mark.asyncio
async def test_reject_unauthorized_returns_403(
    auth_client: AsyncClient,
) -> None:
    citizen = await _register(auth_client)
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "NOT_A_MEMORY"},
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 403, response.text


@pytest.mark.asyncio
async def test_reject_invalid_reason_returns_422(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "NOT_VALID"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422, response.text


@pytest.mark.asyncio
async def test_get_me_lists_pending_contribution(auth_client: AsyncClient) -> None:
    citizen = await _register(auth_client)
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])

    response = await auth_client.get(
        ME_BASE,
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == str(contribution_id)
    assert items[0]["status"] == "pending"
    assert items[0]["neighborhood"]["slug"] == "boulingrin"
    assert items[0]["rejection_message"] is None


@pytest.mark.asyncio
async def test_get_me_lists_approved_contribution(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])
    await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(moderator.access_token),
    )

    response = await auth_client.get(
        ME_BASE,
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 200, response.text
    item = response.json()["items"][0]
    assert item["status"] == "approved"
    assert item["approved_at"] is not None
    assert item["rejection_message"] is None


@pytest.mark.asyncio
async def test_get_me_rejected_exposes_pedagogical_message(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await _register(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    contribution_id = await _submit_pending(auth_client, citizen["access_token"])
    await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "NOT_A_MEMORY"},
        headers=auth_header(moderator.access_token),
    )

    response = await auth_client.get(
        ME_BASE,
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 200, response.text
    item = response.json()["items"][0]
    assert item["status"] == "rejected"
    assert item["rejection_reason_code"] == "NOT_A_MEMORY"
    assert item["rejection_message"] == (
        "Cela ressemblait davantage à un avis qu'à un souvenir personnel."
    )


@pytest.mark.asyncio
async def test_get_me_cannot_see_other_users_contributions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    author = await _register(auth_client)
    other = await _register(auth_client)
    contribution_id = await _submit_pending(auth_client, author["access_token"])
    _ = contribution_id

    response = await auth_client.get(
        ME_BASE,
        headers=auth_header(other["access_token"]),
    )
    assert response.status_code == 200, response.text
    assert response.json()["items"] == []
