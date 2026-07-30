"""Tribe API tests (TICKET-A.2)."""

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
        "email": f"tribes{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Tribes {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_staff_creates_public_tribe_and_member_joins(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-join")
    slug = f"join-{member['user']['id'][:8]}"

    create = await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu test join",
            "description": "Description suffisamment longue pour la tribu pilote Reims.",
            "city": "Reims",
            "category": "music",
            "visibility": "public",
        },
        headers=rbac_auth_header(staff.access_token),
    )
    assert create.status_code == 201, create.text

    join = await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    assert join.status_code == 200, join.text
    assert join.json()["role"] == "member"

    detail = await auth_client.get(
        f"/api/v1/tribes/{slug}?city=Reims",
        headers=auth_header(member["access_token"]),
    )
    assert detail.status_code == 200
    assert detail.json()["viewer_is_member"] is True


@pytest.mark.asyncio
async def test_leave_tribe_is_silent(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-leave")
    slug = f"leave-{member['user']['id'][:8]}"
    await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu leave",
            "description": "Tribu pour tester la sortie silencieuse sans drama produit.",
            "city": "Reims",
            "category": "cafe_culture",
            "visibility": "public",
        },
        headers=rbac_auth_header(staff.access_token),
    )
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    leave = await auth_client.post(
        f"/api/v1/tribes/{slug}/leave?city=Reims",
        headers=auth_header(member["access_token"]),
    )
    assert leave.status_code == 204, leave.text

    wall = await auth_client.get(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        headers=auth_header(member["access_token"]),
    )
    assert wall.status_code == 403


@pytest.mark.asyncio
async def test_private_invite_flow(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    owner = await _register(auth_client, suffix="-owner")
    invitee = await _register(auth_client, suffix="-invitee")
    slug = f"priv-{owner['user']['id'][:8]}"

    create = await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu privée",
            "description": (
                "Accès sur invitation uniquement — pas listée comme tribu publique ouverte."
            ),
            "city": "Reims",
            "category": "volunteering",
            "visibility": "private_invite",
        },
        headers=rbac_auth_header(staff.access_token),
    )
    assert create.status_code == 201

    public_list = await auth_client.get("/api/v1/tribes?city=Reims")
    slugs = {t["slug"] for t in public_list.json()["items"]}
    assert slug not in slugs

    blocked = await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(invitee["access_token"]),
    )
    assert blocked.status_code == 403

    invite = await auth_client.post(
        f"/api/v1/tribes/{slug}/invite?city=Reims",
        headers=rbac_auth_header(staff.access_token),
    )
    assert invite.status_code == 200, invite.text
    token = invite.json()["token"]

    accept = await auth_client.post(
        f"/api/v1/tribe-invitations/{token}/accept",
        json={"charter_accepted": True},
        headers=auth_header(invitee["access_token"]),
    )
    assert accept.status_code == 200, accept.text


@pytest.mark.asyncio
async def test_archive_tribe_blocks_new_join(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-arch")
    slug = f"arch-{member['user']['id'][:8]}"
    await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu archivée",
            "description": "Tribu pilote destinée à être archivée pour test de fermeture.",
            "city": "Reims",
            "category": "association",
            "visibility": "public",
        },
        headers=rbac_auth_header(staff.access_token),
    )
    archive = await auth_client.post(
        f"/api/v1/admin/tribes/{slug}/archive?city=Reims",
        headers=rbac_auth_header(staff.access_token),
    )
    assert archive.status_code == 200, archive.text
    assert archive.json()["is_archived"] is True

    join = await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    assert join.status_code == 404, join.text


@pytest.mark.asyncio
async def test_tribe_post_rate_limit(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-spam")
    slug = f"spam-{member['user']['id'][:8]}"
    await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu anti-spam",
            "description": "Test du cooldown publication 60 secondes entre deux posts.",
            "city": "Reims",
            "category": "music",
            "visibility": "public",
        },
        headers=rbac_auth_header(staff.access_token),
    )
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    first = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Premier message tribu."},
        headers=auth_header(member["access_token"]),
    )
    assert first.status_code == 201, first.text
    second = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Deuxième message trop rapide."},
        headers=auth_header(member["access_token"]),
    )
    assert second.status_code == 429, second.text
    assert second.json()["code"] == "TRIBE_POST_RATE_LIMIT"


@pytest.mark.asyncio
async def test_citizen_creates_tribe_via_public_endpoint_and_becomes_owner(
    auth_client: AsyncClient,
) -> None:
    # Chemin CITOYEN (POST /tribes), PAS le chemin staff (/admin/tribes) — ferme le trou
    # d'audit : la suite verte ne testait que la creation staff, jamais celle du wizard citoyen.
    creator = await _register(auth_client, suffix="-citizen-create")
    resp = await auth_client.post(
        "/api/v1/tribes",
        json={
            "name": "Reims Runners Citoyen",
            "description": "Une tribu creee par un citoyen via le wizard public.",
            "city": "Reims",
            "category": "photography",
            "visibility": "public",
            "charter_accepted": True,
        },
        headers=auth_header(creator["access_token"]),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    slug = body["slug"]
    assert slug  # slug derive du nom
    assert body["is_featured"] is False  # champ privilegie force serveur-side
    assert body["member_limit"] == 150

    # Le createur est bien OWNER de la tribu creee.
    detail = await auth_client.get(
        f"/api/v1/tribes/{slug}?city=Reims",
        headers=auth_header(creator["access_token"]),
    )
    assert detail.status_code == 200
    assert detail.json()["viewer_is_member"] is True
    assert detail.json()["viewer_role"] == "owner"


@pytest.mark.asyncio
async def test_citizen_create_requires_charter_acceptance(
    auth_client: AsyncClient,
) -> None:
    creator = await _register(auth_client, suffix="-citizen-nocharter")
    resp = await auth_client.post(
        "/api/v1/tribes",
        json={
            "name": "Tribu Sans Charte",
            "description": "Cette creation doit echouer sans acceptation de charte.",
            "city": "Reims",
            "category": "photography",
            "visibility": "public",
            "charter_accepted": False,
        },
        headers=auth_header(creator["access_token"]),
    )
    assert resp.status_code == 422, resp.text
    assert resp.json()["code"] == "TRIBE_CHARTER_REQUIRED"
