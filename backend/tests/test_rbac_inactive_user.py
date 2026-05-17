"""Inactive users and expired tokens."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.core.config import get_settings
from app.db.session import get_engine, get_session_factory
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import select

from tests.conftest_rbac import auth_header, register_user

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

MODERATION_URL = "/api/v1/rbac/moderation/check"
INACTIVE_PROBE_URL = "/api/v1/rbac/test/inactive-access"
PERMISSIONS_URL = "/api/v1/rbac/me/permissions"


@pytest.mark.asyncio
async def test_inactive_user_denied_with_valid_token(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client)
    engine = get_engine()
    assert engine is not None
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        result = await session.execute(select(User).where(User.id == user.user_id))
        db_user = result.scalar_one()
        db_user.is_active = False
        await session.commit()

    headers = auth_header(user.access_token)
    for url in (MODERATION_URL, PERMISSIONS_URL, INACTIVE_PROBE_URL):
        response = await auth_client.get(url, headers=headers)
        if url == INACTIVE_PROBE_URL:
            response = await auth_client.post(url, headers=headers)
        assert response.status_code == 403, url
        assert response.json()["code"] == "ACCOUNT_SUSPENDED"


@pytest.mark.asyncio
async def test_expired_token_denied(auth_client: AsyncClient) -> None:
    user = await register_user(auth_client)
    settings = get_settings()
    expired = datetime.now(UTC) - timedelta(minutes=5)
    payload = {
        "sub": str(user.user_id),
        "type": "access",
        "iat": expired,
        "exp": expired,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    response = await auth_client.get(MODERATION_URL, headers=auth_header(token))
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
