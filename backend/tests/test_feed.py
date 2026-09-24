"""Feed API tests (TICKET-402)."""

from __future__ import annotations

from typing import Any, cast

import pytest
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    auth_header,
)
from tests.conftest_rbac import RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header
from tests.test_partner_offer_moderation import ADMIN_BASE, PARTNER_BASE, _verified_org_owner

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _register(client: AsyncClient, *, suffix: str, city: str) -> dict[str, Any]:
    body = {
        "email": f"feed{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Feed User {suffix}",
        "city": city,
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _set_profile_city(client: AsyncClient, token: str, city: str) -> None:
    response = await client.patch(
        "/api/v1/profile/me",
        json={"city": city},
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text


@pytest.mark.asyncio
async def test_create_citizen_post(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-citizen", city="Reims")
    response = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Bonjour Reims"},
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["type"] == "post"
    assert body["author"]["type"] == "citizen"
    assert body["body"] == "Bonjour Reims"
    assert body["title"] is None


@pytest.mark.asyncio
async def test_feed_citizen_author_includes_avatar(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-avatar", city="Reims")
    avatar_url = "https://cdn.example.com/freeway-avatar.jpg"
    profile_patch = await auth_client.patch(
        "/api/v1/profile/me",
        json={"avatar_url": avatar_url},
        headers=auth_header(user["access_token"]),
    )
    assert profile_patch.status_code == 200, profile_patch.text

    create = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post avec avatar"},
        headers=auth_header(user["access_token"]),
    )
    assert create.status_code == 201, create.text
    assert create.json()["author"]["logo_url"] == avatar_url

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(user["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    items = feed.json()["items"]
    assert items
    assert items[0]["author"]["logo_url"] == avatar_url


@pytest.mark.asyncio
async def test_create_citizen_post_with_composer_metadata(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-composer", city="Reims")
    response = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Magnifique journée à Reims",
            "visibility": "followers",
            "post_format": "photo",
            "allow_comments": False,
            "allow_shares": True,
            "media_urls": [
                {"url": "https://cdn.example.com/photo.jpg", "media_type": "image"},
            ],
            "cross_post_targets": {
                "instagram": True,
                "tiktok": False,
                "facebook": False,
                "twitter": False,
            },
        },
        headers=auth_header(user["access_token"]),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["media_url"] == "https://cdn.example.com/photo.jpg"
    assert body["composer"] is not None
    assert body["composer"]["visibility"] == "followers"
    assert body["composer"]["allow_comments"] is False
    assert body["composer"]["cross_post_targets"]["instagram"] is True


@pytest.mark.asyncio
async def test_create_post_comments_disabled_blocks_comment(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-nocomments", city="Reims")
    create = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Sans commentaires",
            "allow_comments": False,
        },
        headers=auth_header(user["access_token"]),
    )
    assert create.status_code == 201, create.text
    post_id = create.json()["id"]
    comment = await auth_client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"body": "Test"},
        headers=auth_header(user["access_token"]),
    )
    assert comment.status_code == 403, comment.text
    assert comment.json()["code"] == "COMMENTS_DISABLED"


@pytest.mark.asyncio
async def test_create_organization_post_requires_admin(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, suffix="feed-org")
        await session.commit()

    ok = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "organization",
            "organization_id": str(org_id),
            "body": "Nouvelle carte au menu",
        },
        headers=rbac_auth_header(partner.access_token),
    )
    assert ok.status_code == 201
    assert ok.json()["author"]["type"] == "organization"

    outsider = await _register(auth_client, suffix="-outsider", city="Reims")
    forbidden = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "organization",
            "organization_id": str(org_id),
            "body": "Hack",
        },
        headers=auth_header(outsider["access_token"]),
    )
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_feed_city_first_order(auth_client: AsyncClient) -> None:
    reims = await _register(auth_client, suffix="-reims", city="Reims")
    paris = await _register(auth_client, suffix="-paris", city="Paris")
    await _set_profile_city(auth_client, reims["access_token"], "Reims")
    await _set_profile_city(auth_client, paris["access_token"], "Paris")

    await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post Paris"},
        headers=auth_header(paris["access_token"]),
    )
    await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Post Reims"},
        headers=auth_header(reims["access_token"]),
    )

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(reims["access_token"]),
    )
    assert feed.status_code == 200
    items = feed.json()["items"]
    assert len(items) >= 2
    assert items[0]["body"] == "Post Reims"
    assert items[0]["city"] == "Reims"


@pytest.mark.asyncio
async def test_feed_pagination(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-page", city="Reims")
    token = user["access_token"]
    for index in range(3):
        response = await auth_client.post(
            "/api/v1/posts",
            json={"author_type": "citizen", "body": f"Post {index}"},
            headers=auth_header(token),
        )
        assert response.status_code == 201

    first = await auth_client.get("/api/v1/feed?limit=2", headers=auth_header(token))
    assert first.status_code == 200
    first_body = first.json()
    assert len(first_body["items"]) == 2
    assert first_body["next_cursor"]

    second = await auth_client.get(
        f"/api/v1/feed?limit=2&cursor={first_body['next_cursor']}",
        headers=auth_header(token),
    )
    assert second.status_code == 200
    second_ids = {item["id"] for item in second.json()["items"]}
    first_ids = {item["id"] for item in first_body["items"]}
    assert not second_ids.intersection(first_ids)


@pytest.mark.asyncio
async def test_like_unlike_unique(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-like", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Like me"},
        headers=auth_header(user["access_token"]),
    )
    post_id = created.json()["id"]
    headers = auth_header(user["access_token"])

    like = await auth_client.post(f"/api/v1/posts/{post_id}/like", headers=headers)
    assert like.status_code == 204
    detail = await auth_client.get(f"/api/v1/posts/{post_id}", headers=headers)
    assert detail.json()["like_count"] == 1
    assert detail.json()["liked_by_me"] is True

    duplicate = await auth_client.post(f"/api/v1/posts/{post_id}/like", headers=headers)
    assert duplicate.status_code == 204
    detail2 = await auth_client.get(f"/api/v1/posts/{post_id}", headers=headers)
    assert detail2.json()["like_count"] == 1

    unlike = await auth_client.delete(f"/api/v1/posts/{post_id}/like", headers=headers)
    assert unlike.status_code == 204
    detail3 = await auth_client.get(f"/api/v1/posts/{post_id}", headers=headers)
    assert detail3.json()["like_count"] == 0
    assert detail3.json()["liked_by_me"] is False


@pytest.mark.asyncio
async def test_comment_create_and_soft_delete(auth_client: AsyncClient) -> None:
    user = await _register(auth_client, suffix="-comment", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Commentaires ici"},
        headers=auth_header(user["access_token"]),
    )
    post_id = created.json()["id"]
    headers = auth_header(user["access_token"])

    added = await auth_client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"body": "Super initiative"},
        headers=headers,
    )
    assert added.status_code == 201
    comment_id = added.json()["id"]

    listed = await auth_client.get(f"/api/v1/posts/{post_id}/comments", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1

    deleted = await auth_client.delete(f"/api/v1/comments/{comment_id}", headers=headers)
    assert deleted.status_code == 204

    listed_after = await auth_client.get(f"/api/v1/posts/{post_id}/comments", headers=headers)
    assert listed_after.json()["items"] == []


@pytest.mark.asyncio
async def test_report_post(auth_client: AsyncClient) -> None:
    author = await _register(auth_client, suffix="-author", city="Reims")
    reporter = await _register(auth_client, suffix="-reporter", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Contenu signalé"},
        headers=auth_header(author["access_token"]),
    )
    post_id = created.json()["id"]
    response = await auth_client.post(
        f"/api/v1/posts/{post_id}/report",
        json={"reason": "spam"},
        headers=auth_header(reporter["access_token"]),
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_soft_delete_post_author_and_moderator(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    author = await _register(auth_client, suffix="-del", city="Reims")
    moderator = await rbac_user_factory("MODERATOR")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "À supprimer"},
        headers=auth_header(author["access_token"]),
    )
    post_id = created.json()["id"]

    mod_delete = await auth_client.delete(
        f"/api/v1/posts/{post_id}",
        headers=rbac_auth_header(moderator.access_token),
    )
    assert mod_delete.status_code == 204

    hidden = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(author["access_token"]),
    )
    assert hidden.status_code == 404

    created2 = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Suppression auteur"},
        headers=auth_header(author["access_token"]),
    )
    post_id2 = created2.json()["id"]
    author_delete = await auth_client.delete(
        f"/api/v1/posts/{post_id2}",
        headers=auth_header(author["access_token"]),
    )
    assert author_delete.status_code == 204


@pytest.mark.asyncio
async def test_non_public_post_hidden_from_other_users_feed_and_detail(
    auth_client: AsyncClient,
) -> None:
    author = await _register(auth_client, suffix="-privauthor", city="Reims")
    other = await _register(auth_client, suffix="-privviewer", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Secret pour mes amis proches",
            "visibility": "close_friends",
        },
        headers=auth_header(author["access_token"]),
    )
    assert created.status_code == 201, created.text
    post_id = created.json()["id"]

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(other["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    assert post_id not in [item["id"] for item in feed.json()["items"]]

    detail = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(other["access_token"]),
    )
    assert detail.status_code == 404, detail.text

    comments = await auth_client.get(
        f"/api/v1/posts/{post_id}/comments",
        headers=auth_header(other["access_token"]),
    )
    assert comments.status_code == 404, comments.text


@pytest.mark.asyncio
async def test_non_public_post_still_visible_to_author(
    auth_client: AsyncClient,
) -> None:
    author = await _register(auth_client, suffix="-privowner", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Visible uniquement par moi pour l'instant",
            "visibility": "followers",
        },
        headers=auth_header(author["access_token"]),
    )
    assert created.status_code == 201, created.text
    post_id = created.json()["id"]

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(author["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    assert post_id in [item["id"] for item in feed.json()["items"]]

    detail = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(author["access_token"]),
    )
    assert detail.status_code == 200, detail.text
    assert detail.json()["composer"]["visibility"] == "followers"


@pytest.mark.asyncio
async def test_like_non_public_post_returns_404_and_no_notification(
    auth_client: AsyncClient,
) -> None:
    author = await _register(auth_client, suffix="-likepriv", city="Reims")
    other = await _register(auth_client, suffix="-likeout", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={
            "author_type": "citizen",
            "body": "Post réservé aux amis proches",
            "visibility": "close_friends",
        },
        headers=auth_header(author["access_token"]),
    )
    assert created.status_code == 201, created.text
    post_id = created.json()["id"]

    like = await auth_client.post(
        f"/api/v1/posts/{post_id}/like",
        headers=auth_header(other["access_token"]),
    )
    assert like.status_code == 404, like.text
    assert like.json()["code"] == "POST_NOT_FOUND"

    unlike = await auth_client.delete(
        f"/api/v1/posts/{post_id}/like",
        headers=auth_header(other["access_token"]),
    )
    assert unlike.status_code == 404, unlike.text
    assert unlike.json()["code"] == "POST_NOT_FOUND"

    notifications = await auth_client.get(
        "/api/v1/notifications",
        headers=auth_header(author["access_token"]),
    )
    assert notifications.status_code == 200, notifications.text
    liked_items = [
        item for item in notifications.json()["items"] if item["type"] == "POST_LIKED"
    ]
    assert liked_items == []

    detail = await auth_client.get(
        f"/api/v1/posts/{post_id}",
        headers=auth_header(author["access_token"]),
    )
    assert detail.status_code == 200, detail.text
    assert detail.json()["like_count"] == 0


@pytest.mark.asyncio
async def test_public_post_remains_visible_to_everyone(
    auth_client: AsyncClient,
) -> None:
    author = await _register(auth_client, suffix="-pubauthor", city="Reims")
    viewer = await _register(auth_client, suffix="-pubviewer", city="Reims")
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Bonjour tout le monde"},
        headers=auth_header(author["access_token"]),
    )
    assert created.status_code == 201, created.text
    post_id = created.json()["id"]

    feed = await auth_client.get(
        "/api/v1/feed",
        headers=auth_header(viewer["access_token"]),
    )
    assert feed.status_code == 200, feed.text
    assert post_id in [item["id"] for item in feed.json()["items"]]


@pytest.mark.asyncio
async def test_published_offer_appears_in_feed(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    viewer = await _register(auth_client, suffix="-viewer", city="Reims")
    partner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, suffix="offer-feed")
        await session.commit()

    created = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Brunch offert",
            "offer_type": "gift",
            "description": "Brunch pour deux",
        },
        headers=rbac_auth_header(partner.access_token),
    )
    assert created.status_code == 201
    offer_id = created.json()["id"]

    submitted = await auth_client.post(
        f"{PARTNER_BASE}/{offer_id}/submit",
        headers=rbac_auth_header(partner.access_token),
    )
    assert submitted.status_code == 200

    approved = await auth_client.post(
        f"{ADMIN_BASE}/{offer_id}/approve",
        headers=rbac_auth_header(moderator.access_token),
    )
    assert approved.status_code == 200

    feed = await auth_client.get("/api/v1/feed", headers=auth_header(viewer["access_token"]))
    assert feed.status_code == 200
    offers = [item for item in feed.json()["items"] if item["type"] == "offer"]
    assert any(item["title"] == "Brunch offert" for item in offers)
