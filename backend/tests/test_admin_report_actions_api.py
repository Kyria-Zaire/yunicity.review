"""Admin citizen report resolution API tests (ADMIN-07D-A)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from app.core.feed_constants import ReportStatus
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from app.models.report_admin_action import ReportAdminAction
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header
from tests.test_feed import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/reports"
COCKPIT_BASE = "/api/v1/admin/cockpit/summary"

# ADMIN-PERF-02A caches the whole cockpit summary in Redis for
# COCKPIT_SUMMARY_TTL_SECONDS (= 45s) with NO write-invalidation — a deliberate
# eventual-consistency perf trade-off (absorbs dashboard reload bursts), not a bug.
# Tests asserting the count reflects the DB *immediately* must therefore drop this
# key between a mutation and the next read (see `_cockpit_pending`); otherwise the
# second read returns the stale cached summary rather than a fresh DB count.
_COCKPIT_CITY = "Reims"
_COCKPIT_CACHE_KEY = f"admin:cockpit:summary:v1:{_COCKPIT_CITY.lower()}"


@pytest.fixture(autouse=True)
async def _clear_redis_rate_limits(auth_client: AsyncClient) -> AsyncIterator[None]:
    _ = auth_client
    redis = get_redis_client()
    if redis is not None:
        await redis.flushdb()
    yield
    if redis is not None:
        await redis.flushdb()


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def _create_pending_report(auth_client: AsyncClient) -> tuple[uuid.UUID, str]:
    author = await _register(
        auth_client, suffix=f"-author-{uuid.uuid4().hex[:6]}", city="Reims",
    )
    reporter = await _register(
        auth_client, suffix=f"-reporter-{uuid.uuid4().hex[:6]}", city="Reims",
    )
    created = await auth_client.post(
        "/api/v1/posts",
        json={"author_type": "citizen", "body": "Contenu à signaler pour modération staff."},
        headers=auth_header(author["access_token"]),
    )
    assert created.status_code == 201
    post_id = created.json()["id"]
    reported = await auth_client.post(
        f"/api/v1/posts/{post_id}/report",
        json={"reason": "inappropriate"},
        headers=auth_header(reporter["access_token"]),
    )
    assert reported.status_code == 204

    factory = await _session_factory()
    async with factory() as session:
        from app.models.report import Report

        result = await session.execute(
            select(Report).where(Report.post_id == uuid.UUID(post_id))
        )
        report = result.scalar_one()
        return report.id, post_id


async def _cockpit_pending(auth_client: AsyncClient, token: str) -> int:
    # Drop the cached summary so this read reflects current DB state deterministically,
    # independent of the 45s TTL or any global Redis flush (see _COCKPIT_CACHE_KEY note).
    redis = get_redis_client()
    if redis is not None:
        await redis.delete(_COCKPIT_CACHE_KEY)
    response = await auth_client.get(
        f"{COCKPIT_BASE}?city={_COCKPIT_CITY}",
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    return int(response.json()["attention"]["reports_pending"])


@pytest.mark.asyncio
async def test_moderator_can_dismiss_pending_report(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/dismiss",
        json={"reason": "Signalement non fondé après lecture."},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "dismissed"
    assert data["resolution_note"] == "Signalement non fondé après lecture."
    assert data["resolved_at"] is not None
    assert data["resolver"]["id"] == str(moderator.user_id)
    assert data["resolver"]["email"]


@pytest.mark.asyncio
async def test_moderator_can_resolve_pending_report(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, post_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"reason": "Contenu conforme après vérification.", "hide_post": False},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "reviewed"
    assert data["resolution_note"] == "Contenu conforme après vérification."
    assert data["target_post"]["id"] == post_id
    assert data["target_post"]["is_active"] is True


@pytest.mark.asyncio
async def test_moderator_can_resolve_and_hide_post(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, post_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"reason": "Contenu inapproprié masqué du feed.", "hide_post": True},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "action_taken"
    assert data["target_post"]["is_active"] is False

    factory = await _session_factory()
    async with factory() as session:
        from app.models.post import Post

        post = await session.get(Post, uuid.UUID(post_id))
        assert post is not None
        assert post.is_active is False


@pytest.mark.asyncio
async def test_user_denied_dismiss(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    user = await rbac_user_factory()

    response = await auth_client.post(
        f"{BASE}/{report_id}/dismiss",
        json={},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dismiss_unknown_report_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.post(
        f"{BASE}/{uuid.uuid4()}/dismiss",
        json={},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "REPORT_NOT_FOUND"


@pytest.mark.asyncio
async def test_already_closed_report_returns_409(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)

    first = await auth_client.post(f"{BASE}/{report_id}/dismiss", json={}, headers=headers)
    assert first.status_code == 200

    second = await auth_client.post(f"{BASE}/{report_id}/dismiss", json={}, headers=headers)
    assert second.status_code == 409
    assert second.json()["code"] == "REPORT_ALREADY_CLOSED"


@pytest.mark.asyncio
async def test_hide_post_requires_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"hide_post": True},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "REPORT_REASON_REQUIRED"


@pytest.mark.asyncio
async def test_hide_post_rejects_short_reason(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"reason": "ab", "hide_post": True},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "REPORT_REASON_TOO_SHORT"


@pytest.mark.asyncio
async def test_dismiss_writes_audit_row(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.post(
        f"{BASE}/{report_id}/dismiss",
        json={"reason": "Hors périmètre modération."},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200

    factory = await _session_factory()
    async with factory() as session:
        result = await session.execute(
            select(ReportAdminAction).where(ReportAdminAction.report_id == report_id)
        )
        action = result.scalar_one()
        assert action.action == "dismiss"
        assert action.previous_status == ReportStatus.PENDING.value
        assert action.new_status == ReportStatus.DISMISSED.value
        assert action.reason == "Hors périmètre modération."
        assert action.metadata_ is None


@pytest.mark.asyncio
async def test_resolve_writes_audit_row(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"reason": "OK", "hide_post": False},
        headers=auth_header(moderator.access_token),
    )

    factory = await _session_factory()
    async with factory() as session:
        result = await session.execute(
            select(ReportAdminAction).where(ReportAdminAction.report_id == report_id)
        )
        action = result.scalar_one()
        assert action.action == "resolve"
        assert action.new_status == ReportStatus.REVIEWED.value


@pytest.mark.asyncio
async def test_resolve_hide_post_writes_audit_with_metadata(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, post_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    await auth_client.post(
        f"{BASE}/{report_id}/resolve",
        json={"reason": "Masquage feed citoyen.", "hide_post": True},
        headers=auth_header(moderator.access_token),
    )

    factory = await _session_factory()
    async with factory() as session:
        result = await session.execute(
            select(ReportAdminAction).where(ReportAdminAction.report_id == report_id)
        )
        action = result.scalar_one()
        assert action.action == "resolve_hide_post"
        assert action.new_status == ReportStatus.ACTION_TAKEN.value
        assert action.metadata_ == {"hide_post": True, "post_id": post_id}


@pytest.mark.asyncio
async def test_dismiss_decreases_cockpit_reports_pending(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    token = moderator.access_token
    pending_before = await _cockpit_pending(auth_client, token)

    report_id, _ = await _create_pending_report(auth_client)
    pending_after_create = await _cockpit_pending(auth_client, token)
    assert pending_after_create == pending_before + 1

    dismissed = await auth_client.post(
        f"{BASE}/{report_id}/dismiss",
        json={},
        headers=auth_header(token),
    )
    assert dismissed.status_code == 200

    pending_after_dismiss = await _cockpit_pending(auth_client, token)
    assert pending_after_dismiss == pending_before


@pytest.mark.asyncio
async def test_moderator_can_list_report_actions(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)

    await auth_client.post(
        f"{BASE}/{report_id}/dismiss",
        json={"reason": "Note staff visible."},
        headers=headers,
    )

    response = await auth_client.get(
        f"{BASE}/{report_id}/actions",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["action"] == "dismiss"
    assert item["reason"] == "Note staff visible."
    assert item["actor_user"]["email"]
    assert "metadata" not in item


@pytest.mark.asyncio
async def test_list_actions_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id, _ = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")
    headers = auth_header(moderator.access_token)

    await auth_client.post(f"{BASE}/{report_id}/dismiss", json={}, headers=headers)

    page1 = await auth_client.get(
        f"{BASE}/{report_id}/actions?page=1&page_size=1",
        headers=headers,
    )
    assert page1.status_code == 200
    assert page1.json()["total"] == 1
    assert len(page1.json()["items"]) == 1

    page2 = await auth_client.get(
        f"{BASE}/{report_id}/actions?page=2&page_size=1",
        headers=headers,
    )
    assert page2.status_code == 200
    assert page2.json()["total"] == 1
    assert page2.json()["items"] == []


@pytest.mark.asyncio
async def test_list_actions_unknown_report_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}/{uuid.uuid4()}/actions",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "REPORT_NOT_FOUND"
