"""PASSPORT-PRESENCE-01 (01A) — staff-only presence administration, flag ON.

Covers B3 (minimal registration), B4 (staff only), B8 (explicit UTC window), B10
(``is_test``) and the ``presence_admin_actions`` audit trail.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncIterator, Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.config import get_settings
from app.db.session import get_session_factory
from app.integrations.redis import get_redis_client
from app.models.local_event import LocalEvent
from app.models.presence import (
    PresenceAdminAction,
    PresenceAgentAssignment,
    PresenceCampaign,
    PresenceRegistration,
)
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import func, select

from tests.conftest_passport import create_verified_org_with_offer
from tests.conftest_rbac import AuthenticatedUser, RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/presence"
#: Test-only value, not a secret.
_TEST_PEPPER = "test-only-presence-pepper-not-a-secret-0001"
#: Test-only value, not a secret (>= 32 characters, distinct from the others).
_TEST_RATE_LIMIT_PEPPER = "test-only-rate-limit-pepper-not-a-secret-01"


@pytest.fixture
def auth_env(auth_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Extends the shared ``auth_env``: ``auth_client`` depends on it, so the flag is
    guaranteed to be set before the application is built (routes mounted at startup)."""
    monkeypatch.setenv("PRESENCE_VALIDATION_ENABLED", "true")
    monkeypatch.setenv("PRESENCE_TOKEN_PEPPER", _TEST_PEPPER)
    # P3-1 of 01B: flag on requires a dedicated rate-limit pepper of >= 32 characters.
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", _TEST_RATE_LIMIT_PEPPER)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _organization_id() -> uuid.UUID:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        org, _offer = await create_verified_org_with_offer(
            session, slug_suffix=uuid.uuid4().hex[:8]
        )
        await session.commit()
        return org.id


async def _local_event_id(author_id: uuid.UUID) -> uuid.UUID:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        event = LocalEvent(
            created_by_user_id=author_id,
            title="Événement présence",
            city="Reims",
            starts_at=datetime.now(UTC) + timedelta(days=3),
            location_name="Lieu présence",
        )
        session.add(event)
        await session.commit()
        return event.id


def _window(**overrides: Any) -> dict[str, Any]:
    opens = datetime(2026, 12, 1, 9, 0, tzinfo=UTC)
    payload: dict[str, Any] = {
        "city": "Reims",
        "title": "Atelier pilote",
        "presence_opens_at": opens.isoformat(),
        "presence_closes_at": (opens + timedelta(hours=2)).isoformat(),
    }
    payload.update(overrides)
    return payload


async def _create_campaign(
    client: AsyncClient, staff: AuthenticatedUser, **overrides: Any
) -> dict[str, Any]:
    payload = _window(organization_id=str(await _organization_id()), **overrides)
    response = await client.post(
        f"{BASE}/campaigns", json=payload, headers=auth_header(staff.access_token)
    )
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


async def _audit_rows(**filters: Any) -> list[PresenceAdminAction]:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        stmt = select(PresenceAdminAction).order_by(PresenceAdminAction.created_at)
        for key, value in filters.items():
            stmt = stmt.where(getattr(PresenceAdminAction, key) == value)
        return list((await session.execute(stmt)).scalars().all())


async def _count(model: type[Any], **filters: Any) -> int:
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        stmt = select(func.count()).select_from(model)
        for key, value in filters.items():
            stmt = stmt.where(getattr(model, key) == value)
        return int((await session.execute(stmt)).scalar_one())


# --------------------------------------------------------------------- authz


def _all_routes(campaign_id: str, user_id: str) -> list[tuple[str, str, dict[str, Any] | None]]:
    """The six staff routes, each with a well-formed body where one is accepted."""
    return [
        ("POST", f"{BASE}/campaigns", _window(organization_id=str(uuid.uuid4()))),
        ("GET", f"{BASE}/campaigns", None),
        ("PATCH", f"{BASE}/campaigns/{campaign_id}/status", {"status": "open"}),
        ("PUT", f"{BASE}/campaigns/{campaign_id}/registrations/{user_id}", {"status": "confirmed"}),
        ("PUT", f"{BASE}/campaigns/{campaign_id}/agents/{user_id}", {"status": "active"}),
        ("PUT", f"{BASE}/users/{user_id}/test-flag", {"is_test": True}),
    ]


async def test_anonymous_is_refused_everywhere_without_existence_oracle(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    """Anonymous: 401 on all six routes, identical whether the campaign / user exists or
    not, and identical for a schema-invalid body (authentication runs before business
    validation). No ``*_NOT_FOUND`` code, no write."""
    staff = await rbac_user_factory("MODERATOR")
    existing = await _create_campaign(auth_client, staff)
    campaigns_before = await _count(PresenceCampaign)
    audit_before = await _count(PresenceAdminAction)

    targets = [
        (existing["id"], str(staff.user_id)),  # both exist
        (str(uuid.uuid4()), str(uuid.uuid4())),  # neither exists
    ]
    responses = []
    for campaign_id, user_id in targets:
        for method, url, body in _all_routes(campaign_id, user_id):
            responses.append((method, url, await auth_client.request(method, url, json=body)))
            if body is not None:
                # Schema-invalid but well-formed JSON: must not reach business validation.
                responses.append(
                    (method, url, await auth_client.request(method, url, json={"bogus": 1}))
                )

    reference = responses[0][2]
    assert reference.status_code == 401
    for method, url, response in responses:
        assert response.status_code == 401, (method, url, response.text)
        assert response.content == reference.content, (method, url)
        assert "_NOT_FOUND" not in response.text, (method, url)
    assert await _count(PresenceCampaign) == campaigns_before
    assert await _count(PresenceAdminAction) == audit_before


async def test_anonymous_malformed_json_reveals_nothing_about_resources(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    """Syntactically malformed JSON from an anonymous caller.

    FastAPI decodes the JSON body BEFORE resolving dependencies, so this answers the
    framework's generic ``422 json_invalid`` rather than 401 (observed behaviour, common to
    every JSON route of the API). Business validation, by contrast, runs after
    authentication (previous test: schema-invalid body → 401). What this test locks: the
    answer is identical for an existing and an unknown campaign / user, carries no
    ``*_NOT_FOUND`` code and writes nothing — no existence oracle."""
    staff = await rbac_user_factory("MODERATOR")
    existing = await _create_campaign(auth_client, staff)
    campaigns_before = await _count(PresenceCampaign)
    audit_before = await _count(PresenceAdminAction)
    headers = {"content-type": "application/json"}

    by_route: dict[tuple[str, int], list[tuple[int, bytes]]] = {}
    targets = [(existing["id"], str(staff.user_id)), (str(uuid.uuid4()), str(uuid.uuid4()))]
    for campaign_id, user_id in targets:
        for index, (method, url, body) in enumerate(_all_routes(campaign_id, user_id)):
            if body is None:
                continue
            response = await auth_client.request(
                method, url, content=b'{"status": ', headers=headers
            )
            assert "_NOT_FOUND" not in response.text, (method, url)
            assert response.status_code == 422, (method, url, response.text)
            assert [e["type"] for e in response.json()["detail"]] == ["json_invalid"]
            by_route.setdefault((method, index), []).append(
                (response.status_code, response.content)
            )

    for route, answers in by_route.items():
        assert len(answers) == 2
        assert answers[0] == answers[1], route  # no existence oracle
    assert await _count(PresenceCampaign) == campaigns_before
    assert await _count(PresenceAdminAction) == audit_before


@pytest.mark.parametrize("roles", [(), ("USER",)])
async def test_non_staff_is_refused_everywhere(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, roles: tuple[str, ...]
) -> None:
    citizen = await rbac_user_factory(*roles)
    headers = auth_header(citizen.access_token)
    some_id = uuid.uuid4()
    calls = [
        ("POST", f"{BASE}/campaigns", _window(organization_id=str(uuid.uuid4()))),
        ("GET", f"{BASE}/campaigns", None),
        ("PATCH", f"{BASE}/campaigns/{some_id}/status", {"status": "open"}),
        ("PUT", f"{BASE}/campaigns/{some_id}/registrations/{some_id}", {"status": "confirmed"}),
        ("PUT", f"{BASE}/campaigns/{some_id}/agents/{some_id}", {"status": "active"}),
        ("PUT", f"{BASE}/users/{citizen.user_id}/test-flag", {"is_test": True}),
    ]
    for method, url, body in calls:
        response = await auth_client.request(method, url, json=body, headers=headers)
        assert response.status_code == 403, (method, url, response.text)
        assert response.json()["code"] == "FORBIDDEN"
    assert await _count(PresenceCampaign) == 0
    assert await _count(PresenceAdminAction) == 0


@pytest.mark.parametrize("role", ["MODERATOR", "CITY_ADMIN", "SUPER_ADMIN"])
async def test_staff_roles_are_allowed(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, role: str
) -> None:
    staff = await rbac_user_factory(role)
    campaign = await _create_campaign(auth_client, staff)
    assert campaign["status"] == "draft"


# ----------------------------------------------------------------- campaigns


async def test_create_campaign_is_draft_utc_and_audited(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    event_id = await _local_event_id(staff.user_id)
    campaign = await _create_campaign(
        auth_client,
        staff,
        local_event_id=str(event_id),
        is_test=True,
        presence_opens_at="2026-12-01T10:00:00+01:00",
        presence_closes_at="2026-12-01T12:00:00+01:00",
    )
    assert campaign["status"] == "draft"
    assert campaign["is_test"] is True
    assert campaign["local_event_id"] == str(event_id)
    # Stored and returned in UTC (B8): 10:00+01:00 is 09:00Z.
    assert datetime.fromisoformat(campaign["presence_opens_at"]) == datetime(
        2026, 12, 1, 9, 0, tzinfo=UTC
    )

    rows = await _audit_rows(campaign_id=uuid.UUID(campaign["id"]))
    assert [(r.action, r.previous_value, r.new_value, r.actor_user_id) for r in rows] == [
        ("campaign_created", None, "draft", staff.user_id)
    ]


@pytest.mark.parametrize(
    "overrides",
    [
        {"presence_closes_at": "2026-12-01T09:00:00+00:00"},  # equal to opening
        {"presence_closes_at": "2026-12-01T08:59:59+00:00"},  # before opening
        {"presence_opens_at": "2026-12-01T09:00:00"},  # naive datetime refused
        {"title": "   "},
        {"city": ""},
        {"status": "open"},  # extra field: status is never set at creation
    ],
)
async def test_create_campaign_rejects_invalid_payloads(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory, overrides: dict[str, Any]
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    payload = _window(organization_id=str(await _organization_id()), **overrides)
    response = await auth_client.post(
        f"{BASE}/campaigns", json=payload, headers=auth_header(staff.access_token)
    )
    assert response.status_code == 422, response.text
    assert await _count(PresenceCampaign) == 0


async def test_create_campaign_requires_existing_organization_and_event(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    headers = auth_header(staff.access_token)
    missing_org = await auth_client.post(
        f"{BASE}/campaigns", json=_window(organization_id=str(uuid.uuid4())), headers=headers
    )
    assert missing_org.status_code == 404
    assert missing_org.json()["code"] == "ORGANIZATION_NOT_FOUND"

    missing_event = await auth_client.post(
        f"{BASE}/campaigns",
        json=_window(
            organization_id=str(await _organization_id()), local_event_id=str(uuid.uuid4())
        ),
        headers=headers,
    )
    assert missing_event.status_code == 404
    assert missing_event.json()["code"] == "EVENT_NOT_FOUND"
    assert await _count(PresenceCampaign) == 0


async def test_campaign_lifecycle_follows_the_state_machine(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    headers = auth_header(staff.access_token)
    campaign = await _create_campaign(auth_client, staff)
    url = f"{BASE}/campaigns/{campaign['id']}/status"

    async def _patch(status: str) -> tuple[int, dict[str, Any]]:
        response = await auth_client.patch(url, json={"status": status}, headers=headers)
        return response.status_code, response.json()

    for refused in ("draft", "closed"):
        code, body = await _patch(refused)
        assert (code, body["code"]) == (409, "PRESENCE_INVALID_TRANSITION")
    assert (await _patch("open"))[1]["status"] == "open"
    for refused in ("open", "draft", "archived"):
        code, body = await _patch(refused)
        assert (code, body["code"]) == (409, "PRESENCE_INVALID_TRANSITION")
    assert (await _patch("closed"))[1]["status"] == "closed"
    for refused in ("open", "closed", "draft"):
        assert (await _patch(refused))[0] == 409
    assert (await _patch("archived"))[1]["status"] == "archived"
    for refused in ("draft", "open", "closed", "archived"):
        assert (await _patch(refused))[0] == 409

    rows = await _audit_rows(
        campaign_id=uuid.UUID(campaign["id"]), action="campaign_status_changed"
    )
    assert [(r.previous_value, r.new_value) for r in rows] == [
        ("draft", "open"),
        ("open", "closed"),
        ("closed", "archived"),
    ]


async def test_draft_can_be_archived_directly(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    campaign = await _create_campaign(auth_client, staff)
    response = await auth_client.patch(
        f"{BASE}/campaigns/{campaign['id']}/status",
        json={"status": "archived"},
        headers=auth_header(staff.access_token),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "archived"


async def test_unknown_campaign_is_404(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    headers = auth_header(staff.access_token)
    missing = uuid.uuid4()
    for method, url, body in [
        ("PATCH", f"{BASE}/campaigns/{missing}/status", {"status": "open"}),
        (
            "PUT",
            f"{BASE}/campaigns/{missing}/registrations/{staff.user_id}",
            {"status": "confirmed"},
        ),
        ("PUT", f"{BASE}/campaigns/{missing}/agents/{staff.user_id}", {"status": "active"}),
    ]:
        response = await auth_client.request(method, url, json=body, headers=headers)
        assert response.status_code == 404, (method, url)
        assert response.json()["code"] == "PRESENCE_CAMPAIGN_NOT_FOUND"


async def test_list_campaigns_filters_and_paginates(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    headers = auth_header(staff.access_token)
    real = await _create_campaign(auth_client, staff, title="Réelle")
    test_one = await _create_campaign(auth_client, staff, title="Test", is_test=True)
    await auth_client.patch(
        f"{BASE}/campaigns/{real['id']}/status", json={"status": "open"}, headers=headers
    )

    all_items = (await auth_client.get(f"{BASE}/campaigns", headers=headers)).json()
    assert all_items["total"] == 2

    only_test = (
        await auth_client.get(f"{BASE}/campaigns", params={"is_test": "true"}, headers=headers)
    ).json()
    assert [item["id"] for item in only_test["items"]] == [test_one["id"]]

    only_open = (
        await auth_client.get(f"{BASE}/campaigns", params={"status": "open"}, headers=headers)
    ).json()
    assert [item["id"] for item in only_open["items"]] == [real["id"]]

    first_page = (
        await auth_client.get(
            f"{BASE}/campaigns", params={"page": 1, "page_size": 1}, headers=headers
        )
    ).json()
    assert (first_page["total"], len(first_page["items"]), first_page["page_size"]) == (2, 1, 1)

    too_big = await auth_client.get(f"{BASE}/campaigns", params={"page_size": 51}, headers=headers)
    assert too_big.status_code == 422


# ------------------------------------------------- registrations and agents


@pytest.mark.parametrize(
    ("segment", "model", "user_column", "first", "second", "action"),
    [
        (
            "registrations",
            PresenceRegistration,
            "user_id",
            "confirmed",
            "cancelled",
            "registration_set",
        ),
        (
            "agents",
            PresenceAgentAssignment,
            "agent_user_id",
            "active",
            "revoked",
            "agent_assignment_set",
        ),
    ],
)
async def test_membership_put_is_idempotent_and_audited(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
    segment: str,
    model: type[Any],
    user_column: str,
    first: str,
    second: str,
    action: str,
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    target = await rbac_user_factory()
    headers = auth_header(staff.access_token)
    campaign = await _create_campaign(auth_client, staff)
    campaign_id = uuid.UUID(campaign["id"])
    url = f"{BASE}/campaigns/{campaign_id}/{segment}/{target.user_id}"

    async def _put(status: str) -> dict[str, Any]:
        response = await auth_client.put(url, json={"status": status}, headers=headers)
        assert response.status_code == 200, response.text
        body: dict[str, Any] = response.json()
        return body

    created = await _put(first)
    assert (created["status"], created["changed"]) == (first, True)
    repeated = await _put(first)
    assert (repeated["status"], repeated["changed"]) == (first, False)
    assert repeated["status_changed_at"] == created["status_changed_at"]
    switched = await _put(second)
    assert (switched["status"], switched["changed"]) == (second, True)
    restored = await _put(first)
    assert (restored["status"], restored["changed"]) == (first, True)

    filters = {"campaign_id": campaign_id, user_column: target.user_id}
    assert await _count(model, **filters) == 1
    rows = await _audit_rows(campaign_id=campaign_id, action=action)
    assert [(r.previous_value, r.new_value, r.target_user_id) for r in rows] == [
        (None, first, target.user_id),
        (first, second, target.user_id),
        (second, first, target.user_id),
    ]

    invalid = await auth_client.put(url, json={"status": "posted"}, headers=headers)
    assert invalid.status_code == 422
    unknown_user = await auth_client.put(
        f"{BASE}/campaigns/{campaign_id}/{segment}/{uuid.uuid4()}",
        json={"status": first},
        headers=headers,
    )
    assert unknown_user.status_code == 404
    assert unknown_user.json()["code"] == "USER_NOT_FOUND"


async def test_concurrent_first_registration_creates_a_single_row(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    target = await rbac_user_factory()
    campaign = await _create_campaign(auth_client, staff)
    url = f"{BASE}/campaigns/{campaign['id']}/registrations/{target.user_id}"
    headers = auth_header(staff.access_token)

    responses = await asyncio.gather(
        *(auth_client.put(url, json={"status": "confirmed"}, headers=headers) for _ in range(5))
    )
    assert [r.status_code for r in responses] == [200] * 5
    assert sum(1 for r in responses if r.json()["changed"]) == 1
    assert (
        await _count(
            PresenceRegistration,
            campaign_id=uuid.UUID(campaign["id"]),
            user_id=target.user_id,
        )
        == 1
    )
    assert len(await _audit_rows(action="registration_set")) == 1


# ----------------------------------------------------------------- test flag


async def test_user_test_flag_is_staff_controlled_and_audited(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("SUPER_ADMIN")
    target = await rbac_user_factory()
    headers = auth_header(staff.access_token)
    url = f"{BASE}/users/{target.user_id}/test-flag"

    async def _is_test() -> bool:
        factory = get_session_factory()
        assert factory is not None
        async with factory() as session:
            user = await session.get(User, target.user_id)
            assert user is not None
            return user.is_test

    assert await _is_test() is False  # default for every account
    first = (await auth_client.put(url, json={"is_test": True}, headers=headers)).json()
    assert (first["is_test"], first["changed"]) == (True, True)
    again = (await auth_client.put(url, json={"is_test": True}, headers=headers)).json()
    assert again["changed"] is False
    assert await _is_test() is True
    back = (await auth_client.put(url, json={"is_test": False}, headers=headers)).json()
    assert (back["is_test"], back["changed"]) == (False, True)

    rows = await _audit_rows(action="user_test_flag_set")
    assert [(r.previous_value, r.new_value, r.campaign_id) for r in rows] == [
        ("false", "true", None),
        ("true", "false", None),
    ]

    missing = await auth_client.put(
        f"{BASE}/users/{uuid.uuid4()}/test-flag", json={"is_test": True}, headers=headers
    )
    assert missing.status_code == 404
    malformed = await auth_client.put(url, json={"is_test": "maybe"}, headers=headers)
    assert malformed.status_code == 422


async def test_responses_expose_no_personal_data(
    auth_client: AsyncClient, rbac_user_factory: RbacUserFactory
) -> None:
    staff = await rbac_user_factory("MODERATOR")
    target = await rbac_user_factory()
    headers = auth_header(staff.access_token)
    campaign = await _create_campaign(auth_client, staff)
    bodies = [
        (
            await auth_client.put(
                f"{BASE}/campaigns/{campaign['id']}/registrations/{target.user_id}",
                json={"status": "confirmed"},
                headers=headers,
            )
        ).text,
        (await auth_client.get(f"{BASE}/campaigns", headers=headers)).text,
        (
            await auth_client.put(
                f"{BASE}/users/{target.user_id}/test-flag", json={"is_test": True}, headers=headers
            )
        ).text,
    ]
    for body in bodies:
        assert target.email not in body
        assert staff.email not in body
        assert "Test User" not in body
