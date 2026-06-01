"""Profile avatar/banner upload."""

from __future__ import annotations

import io

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _auth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
async def test_upload_profile_avatar_updates_me(auth_client: AsyncClient) -> None:
    reg = await auth_client.post(
        "/api/v1/auth/register",
        json={
            "email": "avatar-upload@example.com",
            "password": "StrongPassword1!",
            "full_name": "Avatar Test",
            "city": "Reims",
        },
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    response = await auth_client.post(
        "/api/v1/profile/me/avatar",
        headers=_auth_headers(token),
        files={"file": ("avatar.png", io.BytesIO(png), "image/png")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["avatar_url"]
    assert "/media/profiles/" in body["avatar_url"]
