"""Citizen tribe creation (WEB-TRIBE-CREATE-01)."""

from __future__ import annotations

from typing import Any, cast

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"tribe-create{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Tribe Create {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_citizen_create_tribe_success(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "ok")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.post(
        "/api/v1/tribes",
        json={
            "name": "Cafés & Lecture",
            "description": (
                "Tribu pour partager des adresses calmes et des lectures courtes à Reims."
            ),
            "city": "Reims",
            "category": "cafe_culture",
            "visibility": "public",
            "charter_accepted": True,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    data = cast(dict[str, Any], response.json())
    assert data["name"] == "Cafés & Lecture"
    assert data["slug"]
    assert data["viewer_is_member"] is True
    assert data["viewer_role"] == "owner"


@pytest.mark.asyncio
async def test_citizen_create_tribe_requires_charter(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "charter")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.post(
        "/api/v1/tribes",
        json={
            "name": "Sans charte",
            "description": "Description valide pour test charte obligatoire.",
            "city": "Reims",
            "category": "other",
            "visibility": "public",
            "charter_accepted": False,
        },
        headers=headers,
    )
    assert response.status_code == 422, response.text
