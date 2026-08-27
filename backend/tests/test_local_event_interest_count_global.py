"""Global interest_count consistency across every event response (C3-D1.2-R4B).

R4A n'avait corrige que `GET /api/v1/events`. Toutes les autres collections
(`/events/me/saved`, `/partners/{slug}/events`, `/organizations/me/events`)
retombaient encore sur le defaut `interest_count=0` de `_to_response` : elles
servaient un compteur faux tout en paraissant correctes.

Le garde-fou durable est structurel — le parametre n'a plus de defaut, donc un
futur appelant qui l'oublie casse au chargement du module, pas en production.
"""

from __future__ import annotations

import inspect
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.core.partner_constants import PartnerStatus
from app.db.session import get_engine
from app.services.local_event_service import LocalEventService
from httpx import AsyncClient
from sqlalchemy import event as sa_event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import auth_header, register_user
from tests.conftest_rbac import AuthenticatedUser, RbacUserFactory
from tests.conftest_rbac import auth_header as rbac_auth_header
from tests.test_partner_events_api import _partner_org_owner
from tests.test_partner_offer_moderation import _verified_org_owner

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _org_for(partner: AuthenticatedUser, slug: str) -> uuid.UUID:
    async with _session_factory()() as session:
        org_id = await _verified_org_owner(session, partner.user_id, slug)
        await session.commit()
    return org_id


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


# --------------------------------------------------------------------------
# Garde-fou structurel : le defaut silencieux ne peut plus revenir.
# --------------------------------------------------------------------------


@pytest.mark.unit
async def test_interest_count_is_a_mandatory_argument_on_both_serializers() -> None:
    """Aucun appelant ne peut plus omettre le compteur sans erreur immediate."""
    for serializer in (
        LocalEventService._to_response,
        LocalEventService._to_management_response,
    ):
        parameter = inspect.signature(serializer).parameters["interest_count"]
        assert parameter.default is inspect.Parameter.empty, (
            f"{serializer.__qualname__} a reintroduit un defaut sur interest_count"
        )
        assert parameter.kind is inspect.Parameter.KEYWORD_ONLY


# --------------------------------------------------------------------------
# Collections corrigees par R4B.
# --------------------------------------------------------------------------


async def test_saved_events_expose_the_real_interest_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """`/events/me/saved` : le compteur agrege tous les interesses, pas le seul lecteur."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "r4b-saved")
    event_id = await _create_public_event(auth_client, partner, org_id, "R4B enregistre", 3)

    reader = await register_user(auth_client, suffix="-r4b-saved-reader")
    other = await register_user(auth_client, suffix="-r4b-saved-other")
    reader_header = auth_header(reader["access_token"])

    for header in (reader_header, auth_header(other["access_token"])):
        response = await auth_client.post(f"/api/v1/events/{event_id}/interest", headers=header)
        assert response.status_code == 200, response.text

    saved = await auth_client.get("/api/v1/events/me/saved?limit=50", headers=reader_header)
    assert saved.status_code == 200, saved.text
    item = _find(saved.json()["items"], event_id)

    assert item["interest_count"] == 2
    assert item["interested_by_me"] is True

    detail = await auth_client.get(f"/api/v1/events/{event_id}", headers=reader_header)
    assert detail.json()["interest_count"] == item["interest_count"]


async def test_public_partner_events_expose_the_real_interest_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """`/partners/{slug}/events` : vitrine publique, meme verite que le detail."""
    partner: AuthenticatedUser = await rbac_user_factory()
    # La vitrine publique exige un PartnerProfile signe : on reutilise le helper
    # canonique de `test_partner_events_api` plutot qu'une fixture parallele.
    async with _session_factory()() as session:
        org_id = await _partner_org_owner(session, partner.user_id, "r4b", PartnerStatus.ACTIVE)
        await session.commit()
    slug = "partner-org-r4b"
    event_id = await _create_public_event(auth_client, partner, org_id, "R4B vitrine", 4)

    citizen = await register_user(auth_client, suffix="-r4b-partner")
    await auth_client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header(citizen["access_token"]),
    )

    listing = await auth_client.get(f"/api/v1/partners/{slug}/events?limit=50")
    assert listing.status_code == 200, listing.text
    assert _find(listing.json()["items"], event_id)["interest_count"] == 1


async def test_organization_events_expose_the_real_interest_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """`/organizations/me/events` : le partenaire voit l'audience reelle de son evenement."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "r4b-org")
    event_id = await _create_public_event(auth_client, partner, org_id, "R4B backoffice", 5)

    citizen = await register_user(auth_client, suffix="-r4b-org")
    await auth_client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header(citizen["access_token"]),
    )

    listing = await auth_client.get(
        "/api/v1/organizations/me/events?page_size=50",
        headers=rbac_auth_header(partner.access_token),
    )
    assert listing.status_code == 200, listing.text
    assert _find(listing.json()["items"], event_id)["interest_count"] == 1


async def test_freshly_created_event_reports_zero_not_a_stale_default(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Creation : 0 est une valeur metier exacte, et elle le reste apres une mise a jour."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "r4b-create")

    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=rbac_auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "R4B creation",
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=6)).isoformat(),
            "location_name": "Place Drouet d'Erlon",
            "event_type": "local_market",
        },
    )
    assert create.status_code == 201, create.text
    assert create.json()["interest_count"] == 0
    event_id = str(create.json()["id"])

    citizen = await register_user(auth_client, suffix="-r4b-create")
    await auth_client.post(
        f"/api/v1/events/{event_id}/interest",
        headers=auth_header(citizen["access_token"]),
    )

    updated = await auth_client.patch(
        f"/api/v1/organizations/me/events/{event_id}",
        headers=rbac_auth_header(partner.access_token),
        json={"title": "R4B creation modifiee"},
    )
    assert updated.status_code == 200, updated.text
    # La mise a jour d'un evenement existant doit relire le compteur, pas
    # rejouer le 0 legitime de la creation.
    assert updated.json()["interest_count"] == 1


# --------------------------------------------------------------------------
# Budget SQL : l'agregation reste bornee, y compris sur une page vide.
# --------------------------------------------------------------------------


async def test_empty_collection_issues_no_aggregation_query(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Page vide : `interest_counts_for_events([])` court-circuite avant tout SQL."""
    citizen = await register_user(auth_client, suffix="-r4b-empty")
    header = auth_header(citizen["access_token"])

    counter = {"queries": 0}

    def _on_execute(*_args: object, **_kwargs: object) -> None:
        counter["queries"] += 1

    engine = get_engine()
    assert engine is not None
    sync_engine = engine.sync_engine
    sa_event.listen(sync_engine, "before_cursor_execute", _on_execute)
    try:
        counter["queries"] = 0
        saved = await auth_client.get("/api/v1/events/me/saved?limit=50", headers=header)
        queries_for_empty = counter["queries"]
    finally:
        sa_event.remove(sync_engine, "before_cursor_execute", _on_execute)

    assert saved.status_code == 200, saved.text
    assert saved.json()["items"] == []

    # Aucune borne absolue : l'authentification consomme des requetes. On verifie
    # que la lecture d'une page vide reste dans un budget serre, ce qu'un
    # `SELECT ... IN ()` inutile ferait deja depasser sur une page non vide.
    assert queries_for_empty <= 6, f"budget SQL page vide inattendu: {queries_for_empty}"


async def test_saved_query_budget_is_independent_of_event_count(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Contre-preuve N+1 sur `/events/me/saved`."""
    partner: AuthenticatedUser = await rbac_user_factory()
    org_id = await _org_for(partner, "r4b-budget")

    citizen = await register_user(auth_client, suffix="-r4b-budget")
    header = auth_header(citizen["access_token"])

    created: list[str] = []
    for index in range(4):
        event_id = await _create_public_event(
            auth_client, partner, org_id, f"R4B budget {index}", 20 + index
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
        single = await auth_client.get("/api/v1/events/me/saved?limit=1", headers=header)
        queries_for_one = counter["queries"]

        counter["queries"] = 0
        batch = await auth_client.get("/api/v1/events/me/saved?limit=50", headers=header)
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
