"""Passport activation integration tests."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest_passport import activate_passport, auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


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
