"""Discussions portal endpoints."""

from __future__ import annotations

from typing import Any, cast

import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"discuss{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": f"Discuss {suffix}",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


@pytest.mark.asyncio
async def test_list_discussions_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/discussions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_discussions_empty_for_new_user(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "list")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.get("/api/v1/discussions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["city"] == "Reims"


@pytest.mark.asyncio
async def test_discussion_insights_empty(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "insights")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.get("/api/v1/discussions/insights", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["trending_topics"] == []
    assert body["active_discussions"] == []


@pytest.mark.asyncio
async def test_create_discussion_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        "/api/v1/discussions",
        json={
            "title": "Cafés pour travailler ?",
            "body": "Je cherche un endroit calme avec wifi à Reims centre.",
            "category": "questions",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_discussion_success(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "create")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.post(
        "/api/v1/discussions",
        headers=headers,
        json={
            "title": "Quels cafés pour travailler à Reims ?",
            "body": "Je cherche un endroit calme avec wifi, idéalement près de la gare.",
            "category": "questions",
            "tags": ["Cafés", "Reims"],
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["discussion_title"] == "Quels cafés pour travailler à Reims ?"
    assert body["category_ids"] == ["questions"]
    assert body["discussion_tags"] == ["Cafés", "Reims"]
    assert body["comment_count"] == 0


@pytest.mark.asyncio
async def test_create_discussion_title_too_short(auth_client: AsyncClient) -> None:
    auth = await _register(auth_client, "short")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    response = await auth_client.post(
        "/api/v1/discussions",
        headers=headers,
        json={
            "title": "Hi",
            "body": "Corps suffisamment long pour valider le formulaire.",
            "category": "tips",
        },
    )
    assert response.status_code == 422
