"""Admin citizen reports read API tests (ADMIN-07B)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from app.db.session import get_engine
from app.integrations.redis import get_redis_client
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header
from tests.test_feed import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/admin/reports"


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


async def _create_pending_report(auth_client: AsyncClient) -> uuid.UUID:
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
        return report.id


@pytest.mark.asyncio
async def test_moderator_can_list_pending_reports(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.get(
        f"{BASE}?status=pending",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] >= 1
    assert any(item["id"] == str(report_id) for item in data["items"])
    item = next(row for row in data["items"] if row["id"] == str(report_id))
    assert item["reason"] == "inappropriate"
    assert item["status"] == "pending"
    assert item["target_type"] == "post"
    assert item["reporter"]["email"]
    assert "summary" in data
    assert data["summary"]["pending"] >= 1


@pytest.mark.asyncio
async def test_list_reports_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.get(
        f"{BASE}?status=pending&page=1&page_size=1",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page_size"] == 1
    assert len(data["items"]) == 1
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_reports_reason_filter(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    match = await auth_client.get(
        f"{BASE}?status=pending&reason=inappropriate",
        headers=auth_header(moderator.access_token),
    )
    assert match.status_code == 200
    assert any(item["id"] == str(report_id) for item in match.json()["items"])

    miss = await auth_client.get(
        f"{BASE}?status=pending&reason=spam",
        headers=auth_header(moderator.access_token),
    )
    assert miss.status_code == 200
    assert all(item["id"] != str(report_id) for item in miss.json()["items"])


@pytest.mark.asyncio
async def test_user_denied_list_reports(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_moderator_can_get_report_detail(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    report_id = await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.get(
        f"{BASE}/{report_id}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == str(report_id)
    assert data["status"] == "pending"
    assert data["target_post"]["id"]
    assert data["target_post"]["body_excerpt"]


@pytest.mark.asyncio
async def test_unknown_report_returns_404(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}/{uuid.uuid4()}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
    assert response.json()["code"] == "REPORT_NOT_FOUND"


@pytest.mark.asyncio
async def test_invalid_status_filter_returns_422(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}?status=not-a-status",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "REPORT_STATUS_INVALID"


@pytest.mark.asyncio
async def test_moderator_can_get_reports_admin_summary(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    await _create_pending_report(auth_client)
    moderator = await rbac_user_factory("MODERATOR")

    response = await auth_client.get(
        f"{BASE}/summary",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] >= 1
    assert data["pending"] >= 1
    assert "resolved" in data
    assert "dismissed" in data
    assert "dominant_reason" in data
    assert "generated_at" in data


@pytest.mark.asyncio
async def test_user_denied_reports_admin_summary(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(
        f"{BASE}/summary",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403
