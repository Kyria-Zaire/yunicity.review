"""Passport activation integration tests."""

from __future__ import annotations

from typing import Any

import pytest
from app.core.errors import AppError
from app.integrations.redis import get_redis_client
from app.models.user import User
from app.schemas.passport import PassportActivateRequest, PassportMeResponse
from app.services.passport_service import PassportService
from httpx import AsyncClient

from tests.conftest_passport import activate_passport, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_PASSWORD = "StrongPassword1!"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> None:
    # Isolate register/login rate-limit counters between tests in this module.
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()


async def _login(client: AsyncClient, suffix: str) -> Any:
    return await client.post(
        "/api/v1/auth/login",
        json={"email": f"passport{suffix}@example.com", "password": _PASSWORD},
    )


@pytest.mark.asyncio
async def test_activate_creates_passport(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-act")
    passport = await activate_passport(auth_client, data["access_token"])
    assert passport["status"] == "active"
    assert passport["tier"]["code"] == "neo_arrivant"
    assert passport["passport_number"].startswith("YUN-")
    assert passport["qr_token"].startswith("qr_ph_")


@pytest.mark.asyncio
async def test_activate_is_idempotent(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-idem")
    first = await activate_passport(auth_client, data["access_token"])
    second = await activate_passport(auth_client, data["access_token"])
    assert first["id"] == second["id"]
    assert first["passport_number"] == second["passport_number"]


@pytest.mark.asyncio
async def test_only_one_active_passport_per_user(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-one")
    await activate_passport(auth_client, data["access_token"])
    again = await activate_passport(auth_client, data["access_token"])
    me = await auth_client.get(
        "/api/v1/passport/me",
        headers=auth_header(data["access_token"]),
    )
    assert me.status_code == 200
    assert me.json()["id"] == again["id"]


@pytest.mark.asyncio
async def test_register_auto_activates_passport(auth_client: AsyncClient) -> None:
    data = await register_user(auth_client, suffix="-auto")
    response = await auth_client.get(
        "/api/v1/passport/me",
        headers=auth_header(data["access_token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "active"
    assert body["city"] == "Reims"


@pytest.mark.asyncio
async def test_register_succeeds_when_passport_activation_fails(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _boom(
        self: PassportService, user: User, payload: PassportActivateRequest | None = None
    ) -> PassportMeResponse:
        raise AppError(
            status_code=503,
            code="PASSPORT_TIERS_NOT_CONFIGURED",
            detail="Catalogue des tiers Passport indisponible.",
        )

    monkeypatch.setattr(PassportService, "activate", _boom)

    # register_user asserts 201: account creation must not be blocked by activation.
    data = await register_user(auth_client, suffix="-failact")

    me = await auth_client.get(
        "/api/v1/passport/me",
        headers=auth_header(data["access_token"]),
    )
    assert me.status_code == 404
    assert me.json()["code"] == "PASSPORT_NOT_ACTIVE"


@pytest.mark.asyncio
async def test_login_retries_passport_activation_when_inactive(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    original = PassportService.activate
    state = {"fail": True}

    async def _flaky(
        self: PassportService, user: User, payload: PassportActivateRequest | None = None
    ) -> PassportMeResponse:
        if state["fail"]:
            raise AppError(
                status_code=503,
                code="PASSPORT_TIERS_NOT_CONFIGURED",
                detail="Catalogue des tiers Passport indisponible.",
            )
        return await original(self, user, payload)

    monkeypatch.setattr(PassportService, "activate", _flaky)

    data = await register_user(auth_client, suffix="-retry")
    before = await auth_client.get(
        "/api/v1/passport/me",
        headers=auth_header(data["access_token"]),
    )
    assert before.status_code == 404

    # Activation now works; login must retry it silently and still succeed.
    state["fail"] = False
    login = await _login(auth_client, "-retry")
    assert login.status_code == 200, login.text

    after = await auth_client.get(
        "/api/v1/passport/me",
        headers=auth_header(login.json()["access_token"]),
    )
    assert after.status_code == 200
    assert after.json()["status"] == "active"


@pytest.mark.asyncio
async def test_login_succeeds_even_if_reactivation_still_fails(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _boom(
        self: PassportService, user: User, payload: PassportActivateRequest | None = None
    ) -> PassportMeResponse:
        raise AppError(
            status_code=503,
            code="PASSPORT_TIERS_NOT_CONFIGURED",
            detail="Catalogue des tiers Passport indisponible.",
        )

    monkeypatch.setattr(PassportService, "activate", _boom)

    await register_user(auth_client, suffix="-stillfail")
    login = await _login(auth_client, "-stillfail")
    # Login must not be blocked by a still-failing passport activation.
    assert login.status_code == 200, login.text
    assert login.json()["access_token"]


@pytest.mark.asyncio
async def test_login_skips_activation_when_passport_already_active(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data = await register_user(auth_client, suffix="-noretry")
    assert data["access_token"]

    original = PassportService.activate
    calls = {"n": 0}

    async def _counting(
        self: PassportService, user: User, payload: PassportActivateRequest | None = None
    ) -> PassportMeResponse:
        calls["n"] += 1
        return await original(self, user, payload)

    monkeypatch.setattr(PassportService, "activate", _counting)

    login = await _login(auth_client, "-noretry")
    assert login.status_code == 200, login.text
    # Passport already active at register time → no useless re-activation on login.
    assert calls["n"] == 0
