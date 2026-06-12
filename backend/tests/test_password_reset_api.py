"""Password reset endpoint integration tests (QA-01B)."""

from __future__ import annotations

import uuid
from typing import Any
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_GENERIC_FORGOT_MESSAGE = (
    "Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
)
_NEW_PASSWORD = "NewStrongPassword2!"


@pytest.fixture(autouse=True)
def disable_password_reset_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


@pytest.fixture
def password_reset_payload(register_payload: dict[str, str]) -> dict[str, str]:
    """Unique email per test — isolation between cases."""
    suffix = uuid.uuid4().hex[:10]
    return {**register_payload, "email": f"reset-{suffix}@example.com"}


async def _register(client: AsyncClient, payload: dict[str, str]) -> None:
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201


async def _forgot(client: AsyncClient, email: str) -> dict[str, Any]:
    response = await client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert response.status_code == 200
    data: dict[str, Any] = response.json()
    return data


def _extract_token_from_reset_url(reset_url: str) -> str:
    parsed = urlparse(reset_url)
    token = parse_qs(parsed.query).get("token", [None])[0]
    assert token
    return token


@pytest.mark.asyncio
async def test_forgot_password_existing_email(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    await _register(auth_client, password_reset_payload)
    data = await _forgot(auth_client, password_reset_payload["email"])
    assert data["message"] == _GENERIC_FORGOT_MESSAGE
    assert data.get("reset_url")
    assert "token=" in data["reset_url"]


@pytest.mark.asyncio
async def test_forgot_password_unknown_email(auth_client: AsyncClient) -> None:
    data = await _forgot(auth_client, "unknown@example.com")
    assert data["message"] == _GENERIC_FORGOT_MESSAGE
    assert data.get("reset_url") is None


@pytest.mark.asyncio
async def test_reset_password_valid_token(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    await _register(auth_client, password_reset_payload)
    forgot = await _forgot(auth_client, password_reset_payload["email"])
    token = _extract_token_from_reset_url(forgot["reset_url"])

    response = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _NEW_PASSWORD},
    )
    assert response.status_code == 200
    assert "mis à jour" in response.json()["message"].lower()

    login = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": password_reset_payload["email"], "password": _NEW_PASSWORD},
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_expired_token(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    from app.core.config import get_settings
    from app.core.security import hash_refresh_token
    from app.db.session import get_engine
    from app.models.password_reset_token import PasswordResetToken
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    await _register(auth_client, password_reset_payload)
    forgot = await _forgot(auth_client, password_reset_payload["email"])
    token = _extract_token_from_reset_url(forgot["reset_url"])

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = get_settings()
    token_hash = hash_refresh_token(token, settings.refresh_token_pepper)
    async with factory() as session:
        result = await session.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        )
        stored = result.scalar_one()
        stored.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        await session.commit()

    response = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _NEW_PASSWORD},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_RESET_TOKEN"


@pytest.mark.asyncio
async def test_reset_password_invalid_token(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": "not-a-valid-token", "new_password": _NEW_PASSWORD},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_RESET_TOKEN"


@pytest.mark.asyncio
async def test_reset_password_reused_token_rejected(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    await _register(auth_client, password_reset_payload)
    forgot = await _forgot(auth_client, password_reset_payload["email"])
    token = _extract_token_from_reset_url(forgot["reset_url"])

    first = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _NEW_PASSWORD},
    )
    assert first.status_code == 200

    second = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "AnotherStrongPass3!"},
    )
    assert second.status_code == 400
    assert second.json()["code"] == "INVALID_RESET_TOKEN"


@pytest.mark.asyncio
async def test_login_ok_after_reset(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    await _register(auth_client, password_reset_payload)
    forgot = await _forgot(auth_client, password_reset_payload["email"])
    token = _extract_token_from_reset_url(forgot["reset_url"])
    await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _NEW_PASSWORD},
    )

    old_login = await auth_client.post(
        "/api/v1/auth/login",
        json={
            "email": password_reset_payload["email"],
            "password": password_reset_payload["password"],
        },
    )
    assert old_login.status_code == 401

    new_login = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": password_reset_payload["email"], "password": _NEW_PASSWORD},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_refresh_tokens_revoked_after_reset(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
) -> None:
    from app.core.config import get_settings

    await _register(auth_client, password_reset_payload)
    settings = get_settings()
    old_cookie = auth_client.cookies.get(settings.refresh_cookie_name)
    assert old_cookie

    forgot = await _forgot(auth_client, password_reset_payload["email"])
    token = _extract_token_from_reset_url(forgot["reset_url"])
    reset = await auth_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _NEW_PASSWORD},
    )
    assert reset.status_code == 200

    auth_client.cookies.set(settings.refresh_cookie_name, old_cookie)
    refresh = await auth_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 401
