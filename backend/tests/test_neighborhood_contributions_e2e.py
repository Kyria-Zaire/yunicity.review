"""E2E lifecycle tests for neighborhood contributions (FEATURE-QUARTIERS-V2 / Q2-S3-05)."""

from __future__ import annotations

import uuid
from typing import Any

import pytest
from app.integrations.redis import get_redis_client
from httpx import AsyncClient

from tests.conftest_passport import auth_header
from tests.conftest_rbac import RbacUserFactory
from tests.test_neighborhood_contributions_api import (
    ADMIN_BASE,
    BASE,
    ME_BASE,
    VALID_BODY,
    _register,
    _submit_payload,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()

HOOD_DETAIL = "/api/v1/neighborhoods/boulingrin"
E2E_TITLE = "Les Halles le samedi — E2E Q2-S3-05"


@pytest.mark.asyncio
async def test_e2e_contribution_lifecycle_submit_pending_approve_public_profile(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Parcours 1→5 : soumettre → pending profil → approuver → quartier public → profil partagé."""
    citizen = await _register(auth_client)
    headers = auth_header(citizen["access_token"])

    submit = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(title=E2E_TITLE),
        headers=headers,
    )
    assert submit.status_code == 201, submit.text
    submit_body = submit.json()
    contribution_id = submit_body["id"]
    assert submit_body["status"] == "pending"
    assert "relu" in submit_body["message"].lower()

    me_pending = await auth_client.get(ME_BASE, headers=headers)
    assert me_pending.status_code == 200, me_pending.text
    pending_items = me_pending.json()["items"]
    assert len(pending_items) == 1
    pending = pending_items[0]
    assert pending["id"] == contribution_id
    assert pending["status"] == "pending"
    assert pending["neighborhood"]["slug"] == "boulingrin"
    assert pending["body"] == VALID_BODY
    assert pending["submitted_at"]
    assert pending["rejection_message"] is None

    detail_before = await auth_client.get(HOOD_DETAIL, params={"city": "Reims"}, headers=headers)
    assert detail_before.status_code == 200, detail_before.text
    public_ids_before = {item["id"] for item in detail_before.json()["contributions"]}
    assert contribution_id not in public_ids_before

    moderator = await rbac_user_factory("MODERATOR")
    approve = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/approve",
        headers=auth_header(moderator.access_token),
    )
    assert approve.status_code == 200, approve.text
    approve_body = approve.json()
    assert approve_body["status"] == "approved"
    assert approve_body["approved_at"] is not None

    detail_after = await auth_client.get(HOOD_DETAIL, params={"city": "Reims"}, headers=headers)
    assert detail_after.status_code == 200, detail_after.text
    detail_json: dict[str, Any] = detail_after.json()
    contributions = detail_json["contributions"]
    assert len(contributions) <= 3
    published = next((item for item in contributions if item["id"] == contribution_id), None)
    assert published is not None
    assert published["title"] == E2E_TITLE
    assert published["body"] == VALID_BODY
    assert published["author_label"]
    assert published["approved_at"] is not None

    me_approved = await auth_client.get(ME_BASE, headers=headers)
    assert me_approved.status_code == 200, me_approved.text
    approved_item = me_approved.json()["items"][0]
    assert approved_item["status"] == "approved"
    assert approved_item["approved_at"] is not None
    assert approved_item["rejection_message"] is None


@pytest.mark.asyncio
async def test_e2e_contribution_lifecycle_reject_pedagogical_profile_not_public(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Parcours 6 : rejet NOT_A_MEMORY → profil pédagogique, absent du quartier public."""
    citizen = await _register(auth_client)
    headers = auth_header(citizen["access_token"])

    submit = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(body=VALID_BODY),
        headers=headers,
    )
    assert submit.status_code == 201, submit.text
    contribution_id = submit.json()["id"]

    moderator = await rbac_user_factory("MODERATOR")
    reject = await auth_client.post(
        f"{ADMIN_BASE}/{contribution_id}/reject",
        json={"reason_code": "NOT_A_MEMORY"},
        headers=auth_header(moderator.access_token),
    )
    assert reject.status_code == 200, reject.text
    assert reject.json()["status"] == "rejected"

    me_rejected = await auth_client.get(ME_BASE, headers=headers)
    assert me_rejected.status_code == 200, me_rejected.text
    item = me_rejected.json()["items"][0]
    assert item["status"] == "rejected"
    assert item["rejection_reason_code"] == "NOT_A_MEMORY"
    assert item["rejection_message"] == (
        "Cela ressemblait davantage à un avis qu'à un souvenir personnel."
    )
    assert "Refusé" not in (item["rejection_message"] or "")

    detail = await auth_client.get(HOOD_DETAIL, params={"city": "Reims"}, headers=headers)
    assert detail.status_code == 200, detail.text
    public_ids = {row["id"] for row in detail.json()["contributions"]}
    assert contribution_id not in public_ids

    # Après rejet, l'utilisateur peut soumettre un nouveau souvenir.
    second = await auth_client.post(
        f"{BASE}/boulingrin/contributions",
        params={"city": "Reims"},
        json=_submit_payload(title="Second essai E2E"),
        headers=headers,
    )
    assert second.status_code == 201, second.text
    assert uuid.UUID(second.json()["id"]) != uuid.UUID(contribution_id)
