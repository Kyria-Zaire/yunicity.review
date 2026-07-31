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


async def _staff_create_tribe(client: AsyncClient, staff_token: str, slug: str) -> None:
    create = await client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": f"Tribu {slug}",
            "description": "Description suffisamment longue pour la tribu de test.",
            "city": "Reims",
            "category": "photography",
            "visibility": "public",
        },
        headers=rbac_auth_header(staff_token),
    )
    assert create.status_code == 201, create.text


async def _join(client: AsyncClient, slug: str, token: str) -> None:
    join = await client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(token),
    )
    assert join.status_code == 200, join.text


async def _notification_types(client: AsyncClient, token: str) -> list[str]:
    resp = await client.get("/api/v1/notifications", headers=auth_header(token))
    assert resp.status_code == 200, resp.text
    return [item["type"] for item in resp.json()["items"]]


@pytest.mark.asyncio
async def test_tribe_post_notifies_members_except_author(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "notif-fanout"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    poster = await _register(auth_client, suffix="-notif-poster")
    reader = await _register(auth_client, suffix="-notif-reader")
    await _join(auth_client, slug, poster["access_token"])
    await _join(auth_client, slug, reader["access_token"])

    created = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Bonjour la tribu !"},
        headers=auth_header(poster["access_token"]),
    )
    assert created.status_code == 201, created.text

    # Le lecteur reçoit la notif ; l'auteur NON (pas de notif pour son propre post).
    assert "TRIBE_POST_CREATED" in await _notification_types(auth_client, reader["access_token"])
    assert "TRIBE_POST_CREATED" not in await _notification_types(
        auth_client, poster["access_token"]
    )


@pytest.mark.asyncio
async def test_tribe_post_respects_per_tribe_mute(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "notif-mute"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    poster = await _register(auth_client, suffix="-mute-poster")
    reader = await _register(auth_client, suffix="-mute-reader")
    await _join(auth_client, slug, poster["access_token"])
    await _join(auth_client, slug, reader["access_token"])

    muted = await auth_client.put(
        f"/api/v1/tribes/{slug}/notifications?city=Reims",
        json={"muted": True},
        headers=auth_header(reader["access_token"]),
    )
    assert muted.status_code == 204, muted.text

    posted = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Message qui ne doit pas notifier le membre muté."},
        headers=auth_header(poster["access_token"]),
    )
    assert posted.status_code == 201, posted.text

    assert "TRIBE_POST_CREATED" not in await _notification_types(
        auth_client, reader["access_token"]
    )


@pytest.mark.asyncio
async def test_posts_new_returns_only_delta(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "posts-delta"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    # Deux membres distincts : le cooldown de 60s interdit à un même user de poster 2x.
    member_a = await _register(auth_client, suffix="-delta-a")
    member_b = await _register(auth_client, suffix="-delta-b")
    await _join(auth_client, slug, member_a["access_token"])
    await _join(auth_client, slug, member_b["access_token"])

    await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "ancien message"},
        headers=auth_header(member_a["access_token"]),
    )
    listing = await auth_client.get(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        headers=auth_header(member_a["access_token"]),
    )
    latest = listing.json()["latest_cursor"]
    assert latest

    posted = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "nouveau message"},
        headers=auth_header(member_b["access_token"]),
    )
    assert posted.status_code == 201, posted.text
    delta = await auth_client.get(
        f"/api/v1/tribes/{slug}/posts/new",
        params={"city": "Reims", "after": latest},
        headers=auth_header(member_a["access_token"]),
    )
    assert delta.status_code == 200, delta.text
    # Seul le delta est renvoyé — pas l'ancien post.
    assert [item["body"] for item in delta.json()["items"]] == ["nouveau message"]


@pytest.mark.asyncio
async def test_create_post_succeeds_when_notification_fails(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "notif-besteffort"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    poster = await _register(auth_client, suffix="-be-poster")
    reader = await _register(auth_client, suffix="-be-reader")
    await _join(auth_client, slug, poster["access_token"])
    await _join(auth_client, slug, reader["access_token"])

    async def _boom(*_args: Any, **_kwargs: Any) -> None:
        raise RuntimeError("notification backend down")

    monkeypatch.setattr(
        "app.services.tribe_post_service.SocialNotificationService.notify_tribe_post", _boom
    )
    posted = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Le post doit réussir malgré l'échec de notification."},
        headers=auth_header(poster["access_token"]),
    )
    # Best-effort : la création du post ne doit JAMAIS échouer à cause de la notif.
    assert posted.status_code == 201, posted.text


@pytest.mark.asyncio
async def test_viewer_notifications_muted_reflects_state(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "mute-reflect"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    member = await _register(auth_client, suffix="-mute-reflect")
    await _join(auth_client, slug, member["access_token"])

    async def viewer_muted() -> bool:
        detail = await auth_client.get(
            f"/api/v1/tribes/{slug}?city=Reims",
            headers=auth_header(member["access_token"]),
        )
        assert detail.status_code == 200, detail.text
        return bool(detail.json()["viewer_notifications_muted"])

    # Par défaut : notifications actives.
    assert await viewer_muted() is False

    muted = await auth_client.put(
        f"/api/v1/tribes/{slug}/notifications?city=Reims",
        json={"muted": True},
        headers=auth_header(member["access_token"]),
    )
    assert muted.status_code == 204, muted.text
    # Le champ reflète l'état réel après l'appel.
    assert await viewer_muted() is True

    await auth_client.put(
        f"/api/v1/tribes/{slug}/notifications?city=Reims",
        json={"muted": False},
        headers=auth_header(member["access_token"]),
    )
    assert await viewer_muted() is False


@pytest.mark.asyncio
async def test_owner_can_archive_own_tribe_and_blocks_joins(
    auth_client: AsyncClient,
) -> None:
    owner = await _register(auth_client, suffix="-arch-owner")
    create = await auth_client.post(
        "/api/v1/tribes",
        json={
            "name": "Tribu à archiver",
            "description": "Tribu créée puis archivée par son propre owner.",
            "city": "Reims",
            "category": "photography",
            "visibility": "public",
            "charter_accepted": True,
        },
        headers=auth_header(owner["access_token"]),
    )
    assert create.status_code == 201, create.text
    slug = create.json()["slug"]

    archive = await auth_client.post(
        f"/api/v1/tribes/{slug}/archive?city=Reims",
        headers=auth_header(owner["access_token"]),
    )
    assert archive.status_code == 200, archive.text
    assert archive.json()["is_archived"] is True

    # Après archivage : plus de nouveaux membres (tribu archivée = introuvable pour le join).
    joiner = await _register(auth_client, suffix="-arch-joiner")
    join = await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(joiner["access_token"]),
    )
    assert join.status_code == 404, join.text


@pytest.mark.asyncio
async def test_non_owner_cannot_archive_tribe(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = "arch-forbidden"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    member = await _register(auth_client, suffix="-arch-member")
    await _join(auth_client, slug, member["access_token"])

    archive = await auth_client.post(
        f"/api/v1/tribes/{slug}/archive?city=Reims",
        headers=auth_header(member["access_token"]),
    )
    assert archive.status_code == 403, archive.text
    assert archive.json()["code"] == "TRIBE_FORBIDDEN"


async def _citizen_create_tribe(client: AsyncClient, token: str, name: str) -> str:
    create = await client.post(
        "/api/v1/tribes",
        json={
            "name": name,
            "description": "Description suffisamment longue pour la tribu de test.",
            "city": "Reims",
            "category": "photography",
            "visibility": "public",
            "charter_accepted": True,
        },
        headers=auth_header(token),
    )
    assert create.status_code == 201, create.text
    return cast(str, create.json()["slug"])


@pytest.mark.asyncio
async def test_owner_can_edit_tribe_fields(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-edit-owner")
    slug = await _citizen_create_tribe(auth_client, owner["access_token"], "Tribu à éditer")

    patch = await auth_client.patch(
        f"/api/v1/tribes/{slug}?city=Reims",
        json={"name": "Nom modifié", "description": "Nouvelle description assez longue."},
        headers=auth_header(owner["access_token"]),
    )
    assert patch.status_code == 200, patch.text
    body = patch.json()
    assert body["name"] == "Nom modifié"
    assert body["description"] == "Nouvelle description assez longue."


@pytest.mark.asyncio
async def test_owner_cannot_feature_own_tribe(auth_client: AsyncClient) -> None:
    # Fuite de privilège corrigée : un owner citoyen ne peut pas mettre sa tribu en avant.
    owner = await _register(auth_client, suffix="-feat-owner")
    slug = await _citizen_create_tribe(auth_client, owner["access_token"], "Tribu non featurable")

    patch = await auth_client.patch(
        f"/api/v1/tribes/{slug}?city=Reims",
        json={"is_featured": True},
        headers=auth_header(owner["access_token"]),
    )
    assert patch.status_code == 403, patch.text
    assert patch.json()["code"] == "TRIBE_FEATURED_STAFF_ONLY"


async def _citizen_create_private_tribe(client: AsyncClient, token: str, name: str) -> str:
    create = await client.post(
        "/api/v1/tribes",
        json={
            "name": name,
            "description": "Tribu privée de test, sur invitation ou demande.",
            "city": "Reims",
            "category": "photography",
            "visibility": "private_invite",
            "charter_accepted": True,
        },
        headers=auth_header(token),
    )
    assert create.status_code == 201, create.text
    return cast(str, create.json()["slug"])


async def _request_join(client: AsyncClient, slug: str, token: str) -> Any:
    return await client.post(
        f"/api/v1/tribes/{slug}/join-requests?city=Reims",
        json={"message": "Je souhaite rejoindre."},
        headers=auth_header(token),
    )


@pytest.mark.asyncio
async def test_join_request_flow_private_tribe(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-owner")
    slug = await _citizen_create_private_tribe(auth_client, owner["access_token"], "Privée JR")
    requester = await _register(auth_client, suffix="-jr-requester")

    # 1. Demande sur tribu privée -> 201.
    created = await _request_join(auth_client, slug, requester["access_token"])
    assert created.status_code == 201, created.text

    # 6. L'owner voit la demande en attente ; un étranger (non-membre) -> 403.
    stranger = await _register(auth_client, suffix="-jr-stranger")
    forbidden = await auth_client.get(
        f"/api/v1/tribes/{slug}/join-requests?city=Reims",
        headers=auth_header(stranger["access_token"]),
    )
    assert forbidden.status_code == 403, forbidden.text

    listing = await auth_client.get(
        f"/api/v1/tribes/{slug}/join-requests?city=Reims",
        headers=auth_header(owner["access_token"]),
    )
    assert listing.status_code == 200, listing.text
    items = listing.json()["items"]
    assert len(items) == 1
    request_id = items[0]["id"]

    # 7. L'owner accepte -> le demandeur devient membre.
    accept = await auth_client.post(
        f"/api/v1/tribes/{slug}/join-requests/{request_id}/accept?city=Reims",
        headers=auth_header(owner["access_token"]),
    )
    assert accept.status_code == 200, accept.text
    detail = await auth_client.get(
        f"/api/v1/tribes/{slug}?city=Reims",
        headers=auth_header(requester["access_token"]),
    )
    assert detail.json()["viewer_is_member"] is True


@pytest.mark.asyncio
async def test_join_request_rejected_on_public_tribe(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-pub-owner")
    slug = await _citizen_create_tribe(auth_client, owner["access_token"], "Publique JR")
    requester = await _register(auth_client, suffix="-jr-pub-req")
    resp = await _request_join(auth_client, slug, requester["access_token"])
    assert resp.status_code == 400, resp.text
    assert resp.json()["code"] == "TRIBE_ALREADY_PUBLIC"


@pytest.mark.asyncio
async def test_member_cannot_request_join(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-mem-owner")
    slug = await _citizen_create_private_tribe(auth_client, owner["access_token"], "Privée mem")
    # L'owner est déjà membre -> sa propre demande est rejetée.
    resp = await _request_join(auth_client, slug, owner["access_token"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "TRIBE_ALREADY_MEMBER"


@pytest.mark.asyncio
async def test_duplicate_pending_request_rejected(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-dup-owner")
    slug = await _citizen_create_private_tribe(auth_client, owner["access_token"], "Privée dup")
    requester = await _register(auth_client, suffix="-jr-dup-req")
    first = await _request_join(auth_client, slug, requester["access_token"])
    assert first.status_code == 201, first.text
    second = await _request_join(auth_client, slug, requester["access_token"])
    assert second.status_code == 409, second.text
    assert second.json()["code"] == "TRIBE_REQUEST_PENDING"


@pytest.mark.asyncio
async def test_join_request_decline_and_non_owner_forbidden(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-dec-owner")
    slug = await _citizen_create_private_tribe(auth_client, owner["access_token"], "Privée dec")
    requester = await _register(auth_client, suffix="-jr-dec-req")
    stranger = await _register(auth_client, suffix="-jr-dec-str")
    created = await _request_join(auth_client, slug, requester["access_token"])
    assert created.status_code == 201, created.text
    request_id = (
        await auth_client.get(
            f"/api/v1/tribes/{slug}/join-requests?city=Reims",
            headers=auth_header(owner["access_token"]),
        )
    ).json()["items"][0]["id"]

    # 9. Un non-owner ne peut pas refuser.
    forbidden = await auth_client.post(
        f"/api/v1/tribes/{slug}/join-requests/{request_id}/decline?city=Reims",
        headers=auth_header(stranger["access_token"]),
    )
    assert forbidden.status_code == 403, forbidden.text

    # 8. L'owner refuse -> le demandeur n'est pas membre.
    decline = await auth_client.post(
        f"/api/v1/tribes/{slug}/join-requests/{request_id}/decline?city=Reims",
        headers=auth_header(owner["access_token"]),
    )
    assert decline.status_code == 204, decline.text
    detail = await auth_client.get(
        f"/api/v1/tribes/{slug}?city=Reims",
        headers=auth_header(requester["access_token"]),
    )
    assert detail.json()["viewer_is_member"] is False


@pytest.mark.asyncio
async def test_rejoin_cooldown_blocks_new_request(auth_client: AsyncClient) -> None:
    owner = await _register(auth_client, suffix="-jr-cd-owner")
    slug = await _citizen_create_private_tribe(auth_client, owner["access_token"], "Privée cd")
    requester = await _register(auth_client, suffix="-jr-cd-req")
    created = await _request_join(auth_client, slug, requester["access_token"])
    assert created.status_code == 201, created.text
    request_id = (
        await auth_client.get(
            f"/api/v1/tribes/{slug}/join-requests?city=Reims",
            headers=auth_header(owner["access_token"]),
        )
    ).json()["items"][0]["id"]
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join-requests/{request_id}/accept?city=Reims",
        headers=auth_header(owner["access_token"]),
    )
    leave = await auth_client.post(
        f"/api/v1/tribes/{slug}/leave?city=Reims",
        headers=auth_header(requester["access_token"]),
    )
    assert leave.status_code == 204, leave.text
    # Re-demande immédiate après un départ -> cooldown (défense en profondeur à la création).
    again = await _request_join(auth_client, slug, requester["access_token"])
    assert again.status_code == 409, again.text
    assert again.json()["code"] == "TRIBE_REJOIN_COOLDOWN"
