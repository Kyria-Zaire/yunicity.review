"""Profile endpoint integration tests."""

from __future__ import annotations

from typing import Any

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _register(
    client: AsyncClient,
    payload: dict[str, str],
    *,
    suffix: str = "",
) -> dict[str, Any]:
    body = {
        "email": f"citoyen{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": payload.get("full_name", "Kyria Mambu"),
        "city": payload.get("city", "Reims"),
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    data: dict[str, Any] = response.json()
    return data


def _auth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
async def test_register_creates_profile(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {})
    token = data["access_token"]
    response = await auth_client.get("/api/v1/profile/me", headers=_auth_headers(token))
    assert response.status_code == 200
    profile = response.json()
    assert profile["username"]
    assert profile["user_id"] == data["user"]["id"]
    assert profile["onboarding_completed"] is False
    assert "email" not in profile


@pytest.mark.asyncio
async def test_username_unique_for_similar_names(auth_client: AsyncClient) -> None:
    first = await _register(auth_client, {"full_name": "Jean Dupont"}, suffix="1")
    second = await _register(auth_client, {"full_name": "Jean Dupont"}, suffix="2")
    p1 = await auth_client.get(
        "/api/v1/profile/me", headers=_auth_headers(first["access_token"])
    )
    p2 = await auth_client.get(
        "/api/v1/profile/me", headers=_auth_headers(second["access_token"])
    )
    assert p1.json()["username"] != p2.json()["username"]


@pytest.mark.asyncio
async def test_patch_profile_success(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="patch")
    token = data["access_token"]
    response = await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={
            "bio": "Citoyen de Reims",
            "interests": ["culture", "food"],
            "visibility": "public",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["bio"] == "Citoyen de Reims"
    assert body["interests"] == ["culture", "food"]


@pytest.mark.asyncio
async def test_patch_immutable_username_forbidden(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="immutable")
    token = data["access_token"]
    response = await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={"username": "hacked_name"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invalid_interests_rejected(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="interests")
    token = data["access_token"]
    response = await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={"interests": ["not_a_real_tag"]},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_INTERESTS"


@pytest.mark.asyncio
async def test_bio_max_length(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="bio")
    token = data["access_token"]
    response = await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={"bio": "x" * 501},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_complete_works(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="complete")
    token = data["access_token"]
    response = await auth_client.post(
        "/api/v1/profile/complete",
        headers=_auth_headers(token),
        json={"city": "Reims", "interests": ["music", "art"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["onboarding_completed"] is True
    assert body["onboarding_step"] == "done"
    assert body["city"] == "Reims"


@pytest.mark.asyncio
async def test_public_profile_success(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="public")
    token = data["access_token"]
    me = await auth_client.get("/api/v1/profile/me", headers=_auth_headers(token))
    username = me.json()["username"]
    await auth_client.post(
        "/api/v1/profile/complete",
        headers=_auth_headers(token),
        json={"city": "Reims", "interests": ["tech"]},
    )
    response = await auth_client.get(f"/api/v1/profile/{username}")
    assert response.status_code == 200
    public = response.json()
    assert public["username"] == username
    assert "email" not in public
    assert "user_id" not in public


@pytest.mark.asyncio
async def test_private_profile_denied(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="private")
    token = data["access_token"]
    me = await auth_client.get("/api/v1/profile/me", headers=_auth_headers(token))
    username = me.json()["username"]
    await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={"visibility": "private"},
    )
    await auth_client.post(
        "/api/v1/profile/complete",
        headers=_auth_headers(token),
        json={"city": "Reims", "interests": ["sports"]},
    )
    response = await auth_client.get(f"/api/v1/profile/{username}")
    assert response.status_code == 404
    assert response.json()["code"] == "PROFILE_NOT_FOUND"


@pytest.mark.asyncio
async def test_unauthorized_profile_me(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/profile/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_profile_linked_to_user(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="linked")
    token = data["access_token"]
    response = await auth_client.get("/api/v1/profile/me", headers=_auth_headers(token))
    assert response.json()["user_id"] == data["user"]["id"]


@pytest.mark.asyncio
async def test_reserved_username_validation_service(auth_client: AsyncClient) -> None:
    from app.core.errors import AppError
    from app.db.session import get_session_factory
    from app.services.profile_service import ProfileService

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        service = ProfileService(session)
        with pytest.raises(AppError) as exc_info:
            service.validate_username_assignment("admin")
        assert exc_info.value.code == "USERNAME_RESERVED"


@pytest.mark.asyncio
async def test_onboarding_complete_requires_city(auth_client: AsyncClient) -> None:
    data = await _register(auth_client, {}, suffix="nocity")
    token = data["access_token"]
    from app.db.session import get_engine
    from app.models.user import User
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        user = await session.get(User, data["user"]["id"])
        assert user is not None
        user.city = None
        await session.commit()

    await auth_client.patch(
        "/api/v1/profile/me",
        headers=_auth_headers(token),
        json={"city": None},
    )
    response = await auth_client.post(
        "/api/v1/profile/complete",
        headers=_auth_headers(token),
        json={"interests": ["food"]},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ONBOARDING_INCOMPLETE"
