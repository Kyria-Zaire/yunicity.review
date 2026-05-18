"""Partner lead CRM API integration tests."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

BASE = "/api/v1/partner-leads"

LEAD_PAYLOAD = {
    "name": "Café du Parc",
    "organization_type": "commerce",
    "contact_name": "Marie Dupont",
    "email": "marie@cafeduparc.fr",
    "phone": "+33326001122",
    "city": "Reims",
    "address": "5 place Drouet d'Erlon",
    "source": "physical_prospecting",
    "tags": ["food", "business"],
    "interested_offers": True,
}


async def _create_lead(
    client: AsyncClient,
    token: str,
    *,
    suffix: str = "",
    **overrides: object,
) -> dict[str, object]:
    payload = {**LEAD_PAYLOAD, **overrides}
    if suffix:
        payload["name"] = f"{payload['name']} {suffix}"
        payload["phone"] = f"+3332600{suffix[:4].zfill(4)}"
    response = await client.post(BASE, json=payload, headers=auth_header(token))
    assert response.status_code == 201, response.text
    data: dict[str, object] = response.json()
    return data


@pytest.mark.asyncio
async def test_create_partner_lead_moderator_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    data = await _create_lead(auth_client, moderator.access_token, suffix="mod")
    assert data["status"] == "new"
    assert data["source"] == "physical_prospecting"
    assert data["tags"] == ["food", "business"]


@pytest.mark.asyncio
async def test_create_partner_lead_super_admin_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    admin = await rbac_user_factory("SUPER_ADMIN")
    data = await _create_lead(auth_client, admin.access_token, suffix="sa")
    assert str(data["name"]).startswith("Café du Parc")


@pytest.mark.asyncio
async def test_create_partner_lead_user_denied(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.post(
        BASE,
        json=LEAD_PAYLOAD,
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_partner_lead_unauthenticated(auth_client: AsyncClient) -> None:
    response = await auth_client.post(BASE, json=LEAD_PAYLOAD)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_partner_leads_filters_and_pagination(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    await _create_lead(
        auth_client,
        moderator.access_token,
        suffix="list1",
        city="Reims",
        status="new",
    )
    await _create_lead(
        auth_client,
        moderator.access_token,
        suffix="list2",
        city="Paris",
        source="landing_page",
    )

    filtered = await auth_client.get(
        f"{BASE}?city=Reims",
        headers=auth_header(moderator.access_token),
    )
    assert filtered.status_code == 200
    filtered_data = filtered.json()
    assert filtered_data["page"] == 1
    assert filtered_data["page_size"] == 20
    assert all(item["city"] == "Reims" for item in filtered_data["items"])

    paged = await auth_client.get(
        f"{BASE}?page=1&page_size=1",
        headers=auth_header(moderator.access_token),
    )
    assert paged.status_code == 200
    paged_data = paged.json()
    assert len(paged_data["items"]) == 1
    assert paged_data["total"] >= 1


@pytest.mark.asyncio
async def test_list_partner_leads_user_denied(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await auth_client.get(BASE, headers=auth_header(user.access_token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_partner_lead_notes_status_tags(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_lead(auth_client, moderator.access_token, suffix="upd")
    lead_id = created["id"]

    response = await auth_client.patch(
        f"{BASE}/{lead_id}",
        json={
            "status": "contacted",
            "notes": "Premier appel effectué.",
            "tags": ["food", "sport"],
        },
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "contacted"
    assert data["notes"] == "Premier appel effectué."
    assert data["tags"] == ["food", "sport"]


@pytest.mark.asyncio
async def test_update_partner_lead_user_denied(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    user = await rbac_user_factory()
    created = await _create_lead(auth_client, moderator.access_token, suffix="deny")
    response = await auth_client.patch(
        f"{BASE}/{created['id']}",
        json={"notes": "hack"},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_convert_partner_lead_creates_organization(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import Organization

    moderator = await rbac_user_factory("MODERATOR")
    owner = await rbac_user_factory(email=f"owner-{uuid.uuid4().hex[:8]}@example.com")
    created = await _create_lead(auth_client, moderator.access_token, suffix="conv")
    lead_id = created["id"]

    response = await auth_client.post(
        f"{BASE}/{lead_id}/convert",
        json={"owner_user_id": str(owner.user_id)},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "converted"
    assert data["converted_organization_id"] is not None
    assert data["converted_at"] is not None

    org_id = uuid.UUID(str(data["converted_organization_id"]))
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await session.get(Organization, org_id)
        assert org is not None
        assert org.verification_status == "pending"
        assert org.visibility == "private"


@pytest.mark.asyncio
async def test_convert_creates_owner_membership(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import OrganizationMember

    moderator = await rbac_user_factory("MODERATOR")
    owner = await rbac_user_factory(email=f"owner2-{uuid.uuid4().hex[:8]}@example.com")
    created = await _create_lead(auth_client, moderator.access_token, suffix="mem")
    lead_id = created["id"]

    convert = await auth_client.post(
        f"{BASE}/{lead_id}/convert",
        json={"owner_user_id": str(owner.user_id)},
        headers=auth_header(moderator.access_token),
    )
    org_id = uuid.UUID(str(convert.json()["converted_organization_id"]))

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == owner.user_id,
            )
        )
        member = result.scalar_one()
        assert member.role == "owner"
        assert member.status == "active"


@pytest.mark.asyncio
async def test_convert_partner_lead_cannot_convert_twice(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    owner = await rbac_user_factory(email=f"owner3-{uuid.uuid4().hex[:8]}@example.com")
    created = await _create_lead(auth_client, moderator.access_token, suffix="twice")
    lead_id = created["id"]
    convert_body = {"owner_user_id": str(owner.user_id)}

    first = await auth_client.post(
        f"{BASE}/{lead_id}/convert",
        json=convert_body,
        headers=auth_header(moderator.access_token),
    )
    assert first.status_code == 200

    second = await auth_client.post(
        f"{BASE}/{lead_id}/convert",
        json=convert_body,
        headers=auth_header(moderator.access_token),
    )
    assert second.status_code == 409
    assert second.json()["code"] == "PARTNER_LEAD_ALREADY_CONVERTED"


@pytest.mark.asyncio
async def test_import_preview_invalid_and_duplicates_no_db_write(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_session_factory
    from app.repositories.partner_lead_repository import PartnerLeadRepository

    moderator = await rbac_user_factory("MODERATOR")
    await _create_lead(
        auth_client,
        moderator.access_token,
        name="Boulangerie Preview",
        phone="+33326999999",
        city="Reims",
    )

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        repo = PartnerLeadRepository(session)
        count_before = await repo.count_all()

    payload = {
        "rows": [
            {"name": "Boulangerie Preview", "city": "Reims", "phone": "+33326999999"},
            {"name": "X", "city": "Reims", "phone": "+33326999999"},
            {"name": ""},
            {"name": "Valid Shop", "city": "Reims", "source": "landing_page"},
        ]
    }
    response = await auth_client.post(
        f"{BASE}/import-preview",
        json=payload,
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_rows"] == 4
    assert len(data["invalid"]) >= 1
    assert len(data["duplicates"]) >= 1
    assert any(row["reason"] == "duplicate_in_database" for row in data["duplicates"])

    async with factory() as session:
        repo = PartnerLeadRepository(session)
        count_after = await repo.count_all()
    assert count_after == count_before


@pytest.mark.asyncio
async def test_get_partner_lead_not_found(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    moderator = await rbac_user_factory("MODERATOR")
    response = await auth_client.get(
        f"{BASE}/{uuid.uuid4()}",
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 404
