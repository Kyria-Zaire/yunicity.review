"""Organization API integration tests."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

def _org_id(data: dict[str, object]) -> uuid.UUID:
    return uuid.UUID(str(data["id"]))


ORG_PAYLOAD = {
    "name": "Boulangerie Saint-Remi",
    "type": "commerce",
    "category": "food",
    "city": "Reims",
    "address": "12 rue Saint-Remi",
    "postal_code": "51100",
    "description": "Boulangerie artisanale",
    "website": "https://example-boulangerie.fr",
    "phone": "+33326000000",
}


async def _create_org(
    client: AsyncClient,
    token: str,
    *,
    suffix: str = "",
    **overrides: object,
) -> dict[str, object]:
    payload = {**ORG_PAYLOAD, **overrides}
    if suffix:
        payload["name"] = f"{payload['name']} {suffix}"
        payload["address"] = f"{payload['address']} {suffix}"
    response = await client.post(
        "/api/v1/organizations/request",
        json=payload,
        headers=auth_header(token),
    )
    assert response.status_code == 201, response.text
    data: dict[str, object] = response.json()
    return data


@pytest.mark.asyncio
async def test_create_organization_request_success(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    data = await _create_org(auth_client, user.access_token)
    assert data["verification_status"] == "pending"
    assert data["visibility"] == "private"
    assert data["slug"]


@pytest.mark.asyncio
async def test_create_organization_creates_owner_membership(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import OrganizationMember

    user = await rbac_user_factory()
    data = await _create_org(auth_client, user.access_token, suffix="owner")
    org_id = _org_id(data)

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user.user_id,
            )
        )
        member = result.scalar_one()
        assert member.role == "owner"
        assert member.status == "active"


@pytest.mark.asyncio
async def test_create_organization_unauthenticated(auth_client: AsyncClient) -> None:
    response = await auth_client.post("/api/v1/organizations/request", json=ORG_PAYLOAD)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_organization_duplicate_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    duplicate_payload = {
        **ORG_PAYLOAD,
        "name": "Boulangerie Unique Dup",
        "address": "42 rue Duplicate",
    }
    await auth_client.post(
        "/api/v1/organizations/request",
        json=duplicate_payload,
        headers=auth_header(user.access_token),
    )
    response = await auth_client.post(
        "/api/v1/organizations/request",
        json=duplicate_payload,
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 409
    assert response.json()["code"] == "DUPLICATE_ORGANIZATION"


@pytest.mark.asyncio
async def test_pending_organization_limit(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    for i in range(5):
        await _create_org(auth_client, user.access_token, suffix=f"limit{i}")
    response = await auth_client.post(
        "/api/v1/organizations/request",
        json={**ORG_PAYLOAD, "name": "Sixième Org", "address": "99 rue Limite"},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 409
    assert response.json()["code"] == "PENDING_ORGANIZATION_LIMIT"


@pytest.mark.asyncio
async def test_list_my_organizations(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="me-list")
    response = await auth_client.get(
        "/api/v1/organizations/me",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert any(item["id"] == created["id"] for item in items)
    assert items[0]["member_role"] == "owner"


@pytest.mark.asyncio
async def test_owner_can_patch_organization(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="patch")
    org_id = created["id"]
    response = await auth_client.patch(
        f"/api/v1/organizations/{org_id}",
        json={"description": "Nouvelle description"},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Nouvelle description"


@pytest.mark.asyncio
async def test_non_member_cannot_patch(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    owner = await rbac_user_factory()
    other = await rbac_user_factory()
    created = await _create_org(auth_client, owner.access_token, suffix="patch-deny")
    response = await auth_client.patch(
        f"/api/v1/organizations/{created['id']}",
        json={"description": "Hack"},
        headers=auth_header(other.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_staff_cannot_patch(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import OrganizationMember

    owner = await rbac_user_factory()
    staff = await rbac_user_factory()
    created = await _create_org(auth_client, owner.access_token, suffix="staff-patch")
    org_id = _org_id(created)

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        session.add(
            OrganizationMember(
                organization_id=org_id,
                user_id=staff.user_id,
                role="staff",
                status="active",
            )
        )
        await session.commit()

    response = await auth_client.patch(
        f"/api/v1/organizations/{org_id}",
        json={"description": "Staff edit"},
        headers=auth_header(staff.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_pending_organization_hidden_from_public(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="hidden")
    response = await auth_client.get(f"/api/v1/organizations/{created['slug']}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_owner_can_view_pending_organization(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="owner-view")
    response = await auth_client.get(
        f"/api/v1/organizations/{created['slug']}",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 200
    assert response.json()["verification_status"] == "pending"
    assert "rejection_reason" not in response.json()
    assert "verified_by_user_id" not in response.json()


@pytest.mark.asyncio
async def test_verified_public_visible(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    owner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_org(auth_client, owner.access_token, suffix="public")

    from app.core.organization_constants import OrganizationVisibility
    from app.db.session import get_engine
    from app.models.organization import Organization

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await session.get(Organization, _org_id(created))
        assert org is not None
        org.visibility = OrganizationVisibility.PUBLIC
        await session.commit()

    await auth_client.post(
        f"/api/v1/organizations/{created['id']}/review",
        json={"decision": "verified", "method": "manual"},
        headers=auth_header(moderator.access_token),
    )

    response = await auth_client.get(f"/api/v1/organizations/{created['slug']}")
    assert response.status_code == 200
    assert response.json()["name"] == created["name"]
    assert "rejection_reason" not in response.json()
    assert "latitude" not in response.json()


@pytest.mark.asyncio
async def test_user_cannot_review(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="no-review")
    response = await auth_client.post(
        f"/api/v1/organizations/{created['id']}/review",
        json={"decision": "verified", "method": "manual"},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_moderator_can_review(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    owner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_org(auth_client, owner.access_token, suffix="mod-review")
    response = await auth_client.post(
        f"/api/v1/organizations/{created['id']}/review",
        json={"decision": "verified", "method": "manual", "reason": "OK"},
        headers=auth_header(moderator.access_token),
    )
    assert response.status_code == 200
    assert response.json()["verification_status"] == "verified"


@pytest.mark.asyncio
async def test_review_does_not_auto_set_public(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import Organization

    owner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_org(auth_client, owner.access_token, suffix="stay-private")
    await auth_client.post(
        f"/api/v1/organizations/{created['id']}/review",
        json={"decision": "verified", "method": "manual"},
        headers=auth_header(moderator.access_token),
    )

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await session.get(Organization, _org_id(created))
        assert org is not None
        assert org.visibility == "private"


@pytest.mark.asyncio
async def test_rejected_sets_reason_in_db_not_in_public_schema(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    from app.db.session import get_engine
    from app.models.organization import Organization

    owner = await rbac_user_factory()
    moderator = await rbac_user_factory("MODERATOR")
    created = await _create_org(auth_client, owner.access_token, suffix="reject")
    await auth_client.post(
        f"/api/v1/organizations/{created['id']}/review",
        json={"decision": "rejected", "method": "manual", "reason": "Documents incomplets"},
        headers=auth_header(moderator.access_token),
    )

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = await session.get(Organization, _org_id(created))
        assert org is not None
        assert org.rejection_reason == "Documents incomplets"

    response = await auth_client.get(
        f"/api/v1/organizations/{created['slug']}",
        headers=auth_header(owner.access_token),
    )
    assert response.status_code == 200
    assert "rejection_reason" not in response.json()


@pytest.mark.asyncio
async def test_owner_can_list_members(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="members")
    response = await auth_client.get(
        f"/api/v1/organizations/{created['id']}/members",
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["role"] == "owner"
    assert items[0]["email"]


@pytest.mark.asyncio
async def test_patch_forbidden_fields_rejected(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    created = await _create_org(auth_client, user.access_token, suffix="forbid")
    response = await auth_client.patch(
        f"/api/v1/organizations/{created['id']}",
        json={"slug": "hacked-slug"},
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 422
