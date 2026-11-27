"""PASSPORT-PRESENCE-01 (01A, B11) — flag OFF: the domain does not exist.

Every presence route answers exactly like an unknown path, for anonymous, citizen and
staff callers alike, whatever the body (even malformed), and nothing is read or written.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator

import pytest
from app.core.config import get_settings
from app.db.session import get_session_factory
from app.models.presence import PresenceAdminAction, PresenceCampaign
from app.models.user import User
from httpx import AsyncClient, Response
from sqlalchemy import func, select

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/presence"


@pytest.fixture
def auth_env(auth_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Flag absent (the default), even if the shell running the suite exports it."""
    monkeypatch.delenv("PRESENCE_VALIDATION_ENABLED", raising=False)
    monkeypatch.delenv("PRESENCE_TOKEN_PEPPER", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _calls(user_id: uuid.UUID) -> list[tuple[str, str]]:
    some_id = uuid.uuid4()
    return [
        ("POST", f"{BASE}/campaigns"),
        ("GET", f"{BASE}/campaigns"),
        ("PATCH", f"{BASE}/campaigns/{some_id}/status"),
        ("PUT", f"{BASE}/campaigns/{some_id}/registrations/{user_id}"),
        ("PUT", f"{BASE}/campaigns/{some_id}/agents/{user_id}"),
        ("PUT", f"{BASE}/users/{user_id}/test-flag"),
    ]


def _assert_unknown_route(response: Response, reference: Response) -> None:
    assert response.status_code == 404
    assert response.content == reference.content
    assert response.headers.get("content-type") == reference.headers.get("content-type")


async def test_flag_is_off_by_default_in_the_running_app(auth_client: AsyncClient) -> None:
    _ = auth_client
    assert get_settings().presence_validation_enabled is False


@pytest.mark.parametrize("roles", [None, (), ("SUPER_ADMIN",)])
async def test_every_route_is_an_unknown_path(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    roles: tuple[str, ...] | None,
) -> None:
    headers: dict[str, str] = {}
    user_id = uuid.uuid4()
    if roles is not None:
        caller = await rbac_user_factory(*roles)
        headers = auth_header(caller.access_token)
        user_id = caller.user_id

    reference = await auth_client.get("/api/v1/admin/does-not-exist", headers=headers)
    assert reference.status_code == 404

    for method, url in _calls(user_id):
        for body in (None, {"status": "open"}, {"is_test": True}):
            response = await auth_client.request(method, url, json=body, headers=headers)
            _assert_unknown_route(response, reference)
        malformed = await auth_client.request(
            method,
            url,
            content=b"{not json",
            headers={**headers, "content-type": "application/json"},
        )
        _assert_unknown_route(malformed, reference)


async def test_nothing_is_written_when_off(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    target = await rbac_user_factory()
    headers = auth_header(staff.access_token)
    await auth_client.post(
        f"{BASE}/campaigns",
        json={
            "organization_id": str(uuid.uuid4()),
            "city": "Reims",
            "title": "Interdit",
            "presence_opens_at": "2026-12-01T09:00:00+00:00",
            "presence_closes_at": "2026-12-01T11:00:00+00:00",
        },
        headers=headers,
    )
    await auth_client.put(
        f"{BASE}/users/{target.user_id}/test-flag", json={"is_test": True}, headers=headers
    )

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        for model in (PresenceCampaign, PresenceAdminAction):
            count = (await session.execute(select(func.count()).select_from(model))).scalar_one()
            assert count == 0, model.__tablename__
        user = await session.get(User, target.user_id)
        assert user is not None
        assert user.is_test is False


async def test_openapi_does_not_list_presence_routes(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/openapi.json")
    assert response.status_code == 200  # test env is not prod: the schema is served
    assert not any("/presence" in path for path in response.json()["paths"])
