"""Auth endpoint integration tests."""

from typing import Any, TypedDict

import pytest
from httpx import AsyncClient, Response

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


class RegisterResult(TypedDict):
    response: Response
    json: dict[str, Any]


async def _register(
    client: AsyncClient,
    payload: dict[str, str],
    *,
    mobile: bool = False,
) -> RegisterResult:
    headers = {"X-Client-Platform": "mobile"} if mobile else {}
    response = await client.post("/api/v1/auth/register", json=payload, headers=headers)
    return RegisterResult(response=response, json=response.json())


@pytest.mark.asyncio
async def test_register_success(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    result = await _register(auth_client, register_payload)
    response = result["response"]
    data = result["json"]
    assert response.status_code == 201
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 900
    assert data["access_token"]
    assert data["user"]["email"] == "citoyen@example.com"
    assert data["user"]["roles"] == ["USER"]
    assert "auth.me.read" in data["user"]["permissions"]
    assert "hashed_password" not in response.text


@pytest.mark.asyncio
async def test_register_duplicate_email(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    result = await _register(auth_client, register_payload)
    assert result["response"].status_code == 409
    assert result["json"]["code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_register_weak_password(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    weak = {**register_payload, "password": "short"}
    result = await _register(auth_client, weak)
    assert result["response"].status_code == 422
    assert result["json"]["code"] == "WEAK_PASSWORD"


@pytest.mark.asyncio
async def test_login_success(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    await _register(auth_client, register_payload)
    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == register_payload["email"]


@pytest.mark.asyncio
async def test_login_wrong_password(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "WrongPassword1!"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
) -> None:
    from app.db.session import get_engine
    from app.models.user import User
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    await _register(auth_client, register_payload)
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(select(User).where(User.email == register_payload["email"]))
        user = result.scalar_one()
        user.is_active = False
        await session.commit()

    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_SUSPENDED"


@pytest.mark.asyncio
async def test_me_authorized(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    reg = await _register(auth_client, register_payload)
    token = reg["json"]["access_token"]
    response = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == register_payload["email"]
    assert "USER" in data["roles"]
    assert "users.read.self" in data["permissions"]


@pytest.mark.asyncio
async def test_me_unauthorized(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_logout_revokes_and_clears_cookie(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    logout = await auth_client.post("/api/v1/auth/logout")
    assert logout.status_code == 204
    refresh = await auth_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 401


@pytest.mark.asyncio
async def test_user_gets_user_role_on_register(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    result = await _register(auth_client, register_payload)
    assert result["json"]["user"]["roles"] == ["USER"]


@pytest.mark.asyncio
async def test_register_mobile_returns_refresh_token_in_body(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    result = await _register(auth_client, register_payload, mobile=True)
    assert result["response"].status_code == 201
    assert result["json"].get("refresh_token")
