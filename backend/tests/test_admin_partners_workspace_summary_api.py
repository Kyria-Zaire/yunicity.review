"""Admin partners workspace summary API tests (ADMIN-PARTNERS-UX-01)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

SUMMARY_URL = "/api/v1/admin/partners/workspace-summary"


async def test_workspace_summary_requires_staff(
    auth_client: AsyncClient,
    rbac_factory: RbacUserFactory,
) -> None:
    user = await rbac_factory.create_user(permissions=["auth.me.read"])
    response = await auth_client.get(SUMMARY_URL, headers=auth_header(user))
    assert response.status_code == 403


async def test_workspace_summary_returns_territorial_counts(
    auth_client: AsyncClient,
    rbac_factory: RbacUserFactory,
) -> None:
    user = await rbac_factory.create_user(permissions=["moderation.manage"])
    response = await auth_client.get(
        f"{SUMMARY_URL}?city=Reims",
        headers=auth_header(user),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Reims"
    assert "generated_at" in body
    for field in (
        "leads_total",
        "leads_open",
        "organizations_pending_review",
        "partners_total",
        "partners_active",
        "partners_verified",
        "partners_public",
        "partners_private",
        "activation_waves_open",
        "activation_items_total",
        "activation_items_ready",
        "activation_items_activated",
    ):
        assert field in body
        assert isinstance(body[field], int)
        assert body[field] >= 0
