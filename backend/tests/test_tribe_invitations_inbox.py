"""Tribe invitation inbox (TICKET-A.5)."""

from __future__ import annotations

from typing import Any, cast

import pytest
from httpx import AsyncClient

from tests.conftest_passport import auth_header
from tests.conftest_rbac import RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"tribe-inv{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Tribe Inv {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_targeted_invitation_list_accept_decline(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    invitee = await _register(auth_client, suffix="-invitee")
    slug = f"inbox-{invitee['user']['id'][:8]}"

    await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu invitation inbox",
            "description": (
                "Tribu privee pour tester les invitations nominatives en boite de reception."
            ),
            "city": "Reims",
            "category": "volunteering",
            "visibility": "private_invite",
        },
        headers=rbac_auth_header(staff.access_token),
    )

    invite = await auth_client.post(
        f"/api/v1/tribes/{slug}/invite?city=Reims",
        json={"invitee_user_id": invitee["user"]["id"]},
        headers=rbac_auth_header(staff.access_token),
    )
    assert invite.status_code == 200, invite.text

    inbox = await auth_client.get(
        "/api/v1/tribe-invitations/me",
        headers=auth_header(invitee["access_token"]),
    )
    assert inbox.status_code == 200, inbox.text
    items = inbox.json()["items"]
    assert len(items) == 1
    assert items[0]["tribe_slug"] == slug

    decline = await auth_client.post(
        f"/api/v1/tribe-invitations/me/{items[0]['id']}/decline",
        headers=auth_header(invitee["access_token"]),
    )
    assert decline.status_code == 204, decline.text

    inbox_after = await auth_client.get(
        "/api/v1/tribe-invitations/me",
        headers=auth_header(invitee["access_token"]),
    )
    assert inbox_after.json()["items"] == []
