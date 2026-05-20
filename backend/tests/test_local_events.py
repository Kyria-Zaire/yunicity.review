"""Local events foundation (TICKET-505)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import LocalEventModerationStatus
from app.db.session import get_engine
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import auth_header, register_user
from tests.conftest_rbac import AuthenticatedUser, RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header
from tests.test_partner_offer_moderation import _verified_org_owner

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_event_types_public(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/events/types")
    assert response.status_code == 200
    assert "cafe_meetup" in response.json()["items"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verified_org_event_auto_approved_and_visible(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner: AuthenticatedUser = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "auto-event")
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=3)
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=rbac_auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Café rencontre du quartier",
            "description": "Un moment convivial à Reims.",
            "event_type": "cafe_meetup",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Café du Centre",
        },
    )
    assert create.status_code == 201, create.text
    assert create.json()["moderation_status"] == LocalEventModerationStatus.APPROVED.value

    listing = await auth_client.get("/api/v1/events?city=Reims")
    assert listing.status_code == 200
    titles = [item["title"] for item in listing.json()["items"]]
    assert "Café rencontre du quartier" in titles


@pytest.mark.integration
@pytest.mark.asyncio
async def test_toggle_interest(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    citizen = await register_user(auth_client, suffix="-event-interest")
    partner: AuthenticatedUser = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "interest-event")
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=5)
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=rbac_auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Marché local",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Place Drouet d'Erlon",
            "event_type": "local_market",
        },
    )
    assert create.status_code == 201
    event_id = create.json()["id"]
    headers = auth_header(citizen["access_token"])
    first = await auth_client.post(f"/api/v1/events/{event_id}/interest", headers=headers)
    assert first.status_code == 200
    assert first.json()["interested"] is True
    second = await auth_client.post(f"/api/v1/events/{event_id}/interest", headers=headers)
    assert second.json()["interested"] is False
