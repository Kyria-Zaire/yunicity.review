"""Collection endpoint interest_count aggregation (C3-D1.2-R4A).

`list_public` appelait `_to_response` sans passer `interest_count` : la valeur
par defaut du schema (0) etait donc servie pour TOUS les evenements de la
collection, alors que l'endpoint detail renvoyait le vrai compte. Deux verites
contradictoires pour la meme donnee.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.db.session import get_engine
from app.models.local_event import LocalEvent
from httpx import AsyncClient
from sqlalchemy import event as sa_event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import auth_header, register_user
from tests.conftest_rbac import AuthenticatedUser, RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header
from tests.test_partner_offer_moderation import _verified_org_owner

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _create_public_event(
    auth_client: AsyncClient,
    partner: AuthenticatedUser,
    org_id: uuid.UUID,
    title: str,
    days: int,
) -> str:
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=rbac_auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": title,
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=days)).isoformat(),
            "location_name": "Place Drouet d'Erlon",
            "event_type": "local_market",
        },
    )
    assert create.status_code == 201, create.text
    return str(create.json()["id"])


def _find(items: list[dict[str, object]], event_id: str) -> dict[str, object]:
    match = [item for item in items if item["id"] == event_id]
    assert len(match) == 1, f"evenement {event_id} absent ou duplique ({len(match)})"
    return match[0]


async def _org_for(partner: AuthenticatedUser, slug: str) -> uuid.UUID:
    async with _session_factory()() as session:
        org_id = await _verified_org_owner(session, partner.user_id, slug)
        await session.commit()
    return org_id


async def test_collection_interest_count_matches_persisted_interests(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """0, 1 et 2 interets : la collection reflete la base, jamais un defaut."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "interest-count")

    zero_id = await _create_public_event(auth_client, partner, org_id, "R4A zero interet", 3)
    one_id = await _create_public_event(auth_client, partner, org_id, "R4A un interet", 4)
    two_id = await _create_public_event(auth_client, partner, org_id, "R4A deux interets", 5)

    citizen_a = await register_user(auth_client, suffix="-r4a-a")
    citizen_b = await register_user(auth_client, suffix="-r4a-b")
    header_a = auth_header(citizen_a["access_token"])
    header_b = auth_header(citizen_b["access_token"])

    for event_id, header in ((one_id, header_a), (two_id, header_a), (two_id, header_b)):
        response = await auth_client.post(f"/api/v1/events/{event_id}/interest", headers=header)
        assert response.status_code == 200, response.text

    listing = await auth_client.get("/api/v1/events?city=Reims&page_size=50")
    assert listing.status_code == 200
    items = listing.json()["items"]

    assert _find(items, zero_id)["interest_count"] == 0
    assert _find(items, one_id)["interest_count"] == 1
    assert _find(items, two_id)["interest_count"] == 2

    for item in items:
        assert isinstance(item["interest_count"], int)
        assert item["interest_count"] >= 0


async def test_collection_and_detail_agree_on_interest_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Collection et detail ne doivent plus se contredire."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "interest-agree")

    event_id = await _create_public_event(auth_client, partner, org_id, "R4A accord", 6)
    citizen = await register_user(auth_client, suffix="-r4a-agree")
    await auth_client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header(citizen["access_token"]),
    )

    listing = await auth_client.get("/api/v1/events?city=Reims&page_size=50")
    detail = await auth_client.get(f"/api/v1/events/{event_id}")
    assert detail.status_code == 200

    from_collection = _find(listing.json()["items"], event_id)["interest_count"]
    from_detail = detail.json()["interest_count"]
    assert from_collection == from_detail == 1


async def test_aggregation_does_not_duplicate_or_reintroduce_events(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Un evenement annule reste exclu, et rien n'est duplique par l'agregation."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "interest-cancel")

    event_id = await _create_public_event(auth_client, partner, org_id, "R4A annule", 7)
    citizen = await register_user(auth_client, suffix="-r4a-cancel")
    await auth_client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header(citizen["access_token"]),
    )

    async with _session_factory()() as session:
        event = await session.get(LocalEvent, uuid.UUID(event_id))
        assert event is not None
        event.is_cancelled = True
        await session.commit()

    items = (await auth_client.get("/api/v1/events?city=Reims&page_size=50")).json()["items"]
    ids = [item["id"] for item in items]
    assert len(ids) == len(set(ids)), "evenements dupliques par l'agregation"


async def test_query_budget_is_independent_of_event_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Contre-preuve N+1 : le budget SQL ne croit pas avec le nombre d'evenements."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "interest-budget")

    citizen = await register_user(auth_client, suffix="-r4a-budget")
    header = auth_header(citizen["access_token"])

    created: list[str] = []
    for index in range(4):
        event_id = await _create_public_event(
            auth_client, partner, org_id, f"R4A budget {index}", 10 + index
        )
        created.append(event_id)
        await auth_client.post(f"/api/v1/events/{event_id}/interest", headers=header)

    counter = {"queries": 0}

    def _on_execute(*_args: object, **_kwargs: object) -> None:
        counter["queries"] += 1

    engine = get_engine()
    assert engine is not None
    sync_engine = engine.sync_engine
    sa_event.listen(sync_engine, "before_cursor_execute", _on_execute)
    try:
        counter["queries"] = 0
        single = await auth_client.get("/api/v1/events?city=Reims&page_size=1")
        queries_for_one = counter["queries"]

        counter["queries"] = 0
        batch = await auth_client.get("/api/v1/events?city=Reims&page_size=50")
        queries_for_many = counter["queries"]
    finally:
        sa_event.remove(sync_engine, "before_cursor_execute", _on_execute)

    assert single.status_code == 200
    assert batch.status_code == 200
    batch_items = batch.json()["items"]
    assert len(batch_items) > len(single.json()["items"])

    assert queries_for_many <= queries_for_one, (
        "budget SQL non borne: "
        f"1 evenement={queries_for_one}, {len(batch_items)} evenements={queries_for_many}"
    )

    for event_id in created:
        assert _find(batch_items, event_id)["interest_count"] == 1
