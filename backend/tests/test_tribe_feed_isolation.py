"""Feed / tribe wall isolation invariants (TICKET-A.2)."""

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
        "email": f"tribe-feed{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Tribe Feed {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _staff_create_tribe(client: AsyncClient, staff_token: str, slug: str) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": f"Tribe {slug}",
            "description": "Tribu de test pour isolation feed — charte acceptée en pilote.",
            "city": "Reims",
            "category": "sport_local",
            "visibility": "public",
            "is_featured": True,
        },
        headers=rbac_auth_header(staff_token),
    )
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_tribe_post_never_appears_in_global_feed(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-member")
    slug = f"iso-{member['user']['id'][:8]}"
    await _staff_create_tribe(auth_client, staff.access_token, slug)

    join = await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    assert join.status_code == 200, join.text

    post = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Message visible uniquement dans la tribu."},
        headers=auth_header(member["access_token"]),
    )
    assert post.status_code == 201, post.text
    tribe_post_id = post.json()["id"]

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(member["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    feed_ids = {item["id"] for item in feed.json()["items"]}
    assert tribe_post_id not in feed_ids


@pytest.mark.asyncio
async def test_global_post_not_visible_on_tribe_wall_without_membership(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    outsider = await _register(auth_client, suffix="-outsider")
    staff = await rbac_user_factory("SUPER_ADMIN")
    slug = f"wall-{outsider['user']['id'][:8]}"
    await _staff_create_tribe(auth_client, staff.access_token, slug)

    city_post = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post ville uniquement"},
        headers=auth_header(outsider["access_token"]),
    )
    assert city_post.status_code == 201, city_post.text

    wall = await auth_client.get(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        headers=auth_header(outsider["access_token"]),
    )
    assert wall.status_code == 403, wall.text


@pytest.mark.asyncio
async def test_global_get_post_hides_tribe_posts(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-hide")
    slug = f"hide-{member['user']['id'][:8]}"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    post = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Secret tribu"},
        headers=auth_header(member["access_token"]),
    )
    post_id = post.json()["id"]
    global_get = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(member["access_token"]),
    )
    assert global_get.status_code == 404, global_get.text


@pytest.mark.asyncio
async def test_global_feed_never_returns_tribe_scoped_posts(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Invariant permanent : aucun item du feed global n'a tribe_id."""
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-invariant")
    slug = f"inv-{member['user']['id'][:8]}"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    tribe_post = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Post tribu pour test invariant feed."},
        headers=auth_header(member["access_token"]),
    )
    assert tribe_post.status_code == 201, tribe_post.text
    tribe_post_id = tribe_post.json()["id"]

    city_post = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post ville pour mélanger le feed."},
        headers=auth_header(member["access_token"]),
    )
    assert city_post.status_code == 201, city_post.text
    city_post_id = city_post.json()["id"]

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(member["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    feed_ids = {item["id"] for item in feed.json()["items"]}
    assert tribe_post_id not in feed_ids, "Invariant : post tribu absent du feed global"
    assert city_post_id in feed_ids, "Le feed global inclut toujours les posts ville"


@pytest.mark.asyncio
async def test_global_post_detail_never_exposes_tribe_wall_post(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Invariant : GET /posts/{id} masque les posts tribu (pas de fuite discovery)."""
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-disc")
    slug = f"disc-{member['user']['id'][:8]}"
    await _staff_create_tribe(auth_client, staff.access_token, slug)
    await auth_client.post(
        f"/api/v1/tribes/{slug}/join?city=Reims",
        json={"charter_accepted": True},
        headers=auth_header(member["access_token"]),
    )
    post = await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": "Mur tribu uniquement"},
        headers=auth_header(member["access_token"]),
    )
    post_id = post.json()["id"]
    discovery = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(member["access_token"]),
    )
    assert discovery.status_code == 404, discovery.text
