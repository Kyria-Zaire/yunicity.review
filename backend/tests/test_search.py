"""Local search API tests (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

from typing import Any, cast

import pytest
from app.core.search_constants import SEARCH_RATE_LIMIT
from app.integrations.redis import get_redis_client
from httpx import AsyncClient

from tests.conftest_passport import auth_header
from tests.conftest_rbac import RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_SEARCH_TOKEN = "b4searchunique"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


def _group(data: dict[str, Any], key: str) -> dict[str, Any]:
    group: dict[str, Any] = data["groups"][key]
    return group


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"search{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Search User {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _complete_profile(
    client: AsyncClient,
    token: str,
    *,
    bio: str | None = None,
    visibility: str = "public",
) -> None:
    response = await client.post(
        "/api/v1/profile/complete",
        json={"city": "Reims", "interests": ["culture"]},
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    patch_payload: dict[str, Any] = {"visibility": visibility}
    if bio is not None:
        patch_payload["bio"] = bio
    if len(patch_payload) > 0:
        patch = await client.patch(
            "/api/v1/profile/me",
            json=patch_payload,
            headers=auth_header(token),
        )
        assert patch.status_code == 200, patch.text


@pytest.mark.asyncio
async def test_search_finds_city_post_by_content(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-post")
    await _complete_profile(auth_client, user["access_token"])
    body_text = f"Un café convivial {_SEARCH_TOKEN} au centre."
    create = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": body_text},
        headers=auth_header(user["access_token"]),
    )
    assert create.status_code == 201, create.text

    response = await auth_client.get(
        f"/api/v1/search?q={_SEARCH_TOKEN}&city=Reims&type=post",
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    posts = _group(data, "posts")["items"]
    assert len(posts) >= 1
    assert any(_SEARCH_TOKEN in (hit.get("body") or "") for hit in posts)
    assert "items" not in data


@pytest.mark.asyncio
async def test_search_excludes_tribe_posts(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    member = await _register(auth_client, suffix="-tribe")
    await _complete_profile(auth_client, member["access_token"])
    slug = f"search-tribe-{member['user']['id'][:8]}"
    tribe_body = f"Mur tribu secret {_SEARCH_TOKEN} tribuonly"
    await auth_client.post(
        "/api/v1/admin/tribes",
        json={
            "slug": slug,
            "name": "Tribu search isolation",
            "description": "Tribu pour vérifier que la recherche ignore le mur tribu.",
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
    await auth_client.post(
        f"/api/v1/tribes/{slug}/posts?city=Reims",
        json={"body": tribe_body},
        headers=auth_header(member["access_token"]),
    )

    response = await auth_client.get(
        f"/api/v1/search?q={_SEARCH_TOKEN}&city=Reims&type=post",
        headers=auth_header(member["access_token"]),
    )
    assert response.status_code == 200, response.text
    posts = _group(response.json(), "posts")["items"]
    assert not any("tribuonly" in (hit.get("body") or "") for hit in posts)


@pytest.mark.asyncio
async def test_search_neighborhood_filter(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-hood")
    await _complete_profile(auth_client, user["access_token"])
    token = f"{_SEARCH_TOKEN}quartier"
    create = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": f"Post quartier {token}"},
        headers=auth_header(user["access_token"]),
    )
    assert create.status_code == 201, create.text

    unfiltered = await auth_client.get(
        f"/api/v1/search?q={token}&city=Reims&type=post",
        headers=auth_header(user["access_token"]),
    )
    assert unfiltered.status_code == 200
    assert len(_group(unfiltered.json(), "posts")["items"]) >= 1

    filtered = await auth_client.get(
        "/api/v1/search",
        params={
            "q": token,
            "city": "Reims",
            "neighborhood_slug": "centre-ville",
            "type": "post",
        },
        headers=auth_header(user["access_token"]),
    )
    assert filtered.status_code == 200
    assert _group(filtered.json(), "posts")["items"] == []


@pytest.mark.asyncio
async def test_search_hides_private_profile(auth_client: AsyncClient) -> None:
    private_user = await _register(auth_client, suffix="-private")
    await _complete_profile(
        auth_client,
        private_user["access_token"],
        bio=f"Bio privée {_SEARCH_TOKEN} privateprofile",
        visibility="private",
    )
    viewer = await _register(auth_client, suffix="-viewer")
    await _complete_profile(auth_client, viewer["access_token"])

    response = await auth_client.get(
        f"/api/v1/search?q={_SEARCH_TOKEN}&city=Reims&type=user",
        headers=auth_header(viewer["access_token"]),
    )
    assert response.status_code == 200, response.text
    users = _group(response.json(), "users")["items"]
    for hit in users:
        blob = hit.get("body") or hit.get("name") or ""
        assert "privateprofile" not in blob


@pytest.mark.asyncio
async def test_search_finds_public_profile(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-public")
    marker = f"{_SEARCH_TOKEN}publicbio"
    await _complete_profile(
        auth_client,
        user["access_token"],
        bio=f"Bio publique {marker}",
        visibility="public",
    )

    response = await auth_client.get(
        f"/api/v1/search?q={marker}&city=Reims&type=user",
    )
    assert response.status_code == 200, response.text
    assert len(_group(response.json(), "users")["items"]) >= 1


@pytest.mark.asyncio
async def test_search_rate_limit(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is None:
        pytest.skip("Redis requis pour tester le rate limiting search")

    user = await _register(auth_client, suffix="-rl")
    await _complete_profile(auth_client, user["access_token"])
    url = "/api/v1/search?q=reims&city=Reims&type=neighborhood"
    headers = auth_header(user["access_token"])

    for _ in range(SEARCH_RATE_LIMIT):
        ok = await auth_client.get(url, headers=headers)
        assert ok.status_code == 200, ok.text

    blocked = await auth_client.get(url, headers=headers)
    assert blocked.status_code == 429, blocked.text
    assert blocked.json()["code"] == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_search_all_returns_grouped_by_type(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-mixed")
    await _complete_profile(auth_client, user["access_token"])
    await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": f"Post mixte {_SEARCH_TOKEN} mixed"},
        headers=auth_header(user["access_token"]),
    )

    response = await auth_client.get(
        f"/api/v1/search?q={_SEARCH_TOKEN}&city=Reims&type=all",
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "groups" in data
    assert "items" not in data
    for key in (
        "events",
        "organizations",
        "posts",
        "offers",
        "tribes",
        "users",
        "neighborhoods",
    ):
        group = data["groups"][key]
        assert "items" in group
        assert "count" in group
    assert len(data["groups"]["posts"]["items"]) >= 1


@pytest.mark.asyncio
async def test_search_requires_city_when_anonymous(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/search?q=reims")
    assert response.status_code == 400, response.text
    assert response.json()["code"] == "CITY_REQUIRED"


@pytest.mark.asyncio
async def test_search_all_empty_returns_200_with_empty_groups(auth_client: AsyncClient) -> None:
    """Multi-type search with no match must be 200 with the empty-state contract (C3-F0-T2)."""
    response = await auth_client.get(
        f"/api/v1/search?q=zzz{_SEARCH_TOKEN}absent&city=Reims&type=all",
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["type_filter"] == "all"
    assert data["has_more"] is False
    assert "items" not in data
    for key in ("events", "organizations", "posts", "offers", "tribes", "users", "neighborhoods"):
        group = data["groups"][key]
        assert group["items"] == []
        assert group["count"] == 0


@pytest.mark.asyncio
async def test_search_all_repeated_calls_stay_200(auth_client: AsyncClient) -> None:
    """Serialized branches must not leak session state across successive multi-type calls."""
    for _ in range(4):
        response = await auth_client.get(
            f"/api/v1/search?q=reims{_SEARCH_TOKEN}&city=Reims&type=all",
        )
        assert response.status_code == 200, response.text
        assert response.json()["type_filter"] == "all"


@pytest.mark.asyncio
async def test_search_all_accepts_period_and_limit(auth_client: AsyncClient) -> None:
    """The 'all' contract accepts period (event-scoped) and limit without regression."""
    response = await auth_client.get(
        "/api/v1/search",
        params={"q": "reims", "city": "Reims", "type": "all", "period": "past", "limit": 5},
    )
    assert response.status_code == 200, response.text
    assert response.json()["page_size"] <= 5


@pytest.mark.asyncio
async def test_search_invalid_type_returns_400(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/search?q=reims&city=Reims&type=bogus")
    assert response.status_code == 400, response.text
    assert response.json()["code"] == "INVALID_SEARCH_TYPE"
