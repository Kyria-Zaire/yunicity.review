"""Partner offer self-service permissions (TICKET-305A)."""

from __future__ import annotations

import uuid

import pytest
from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.session import get_engine
from app.models.organization import Organization, OrganizationMember
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

PARTNER_BASE = "/api/v1/organizations/me/offers"


async def _setup_verified_org_with_member(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    role: OrganizationMemberRole,
    suffix: str,
) -> uuid.UUID:
    org = Organization(
        slug=f"perm-org-{suffix}",
        name=f"Perm org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PRIVATE,
    )
    session.add(org)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=role,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    await session.flush()
    return org.id


@pytest.mark.asyncio
async def test_owner_can_create_draft(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _setup_verified_org_with_member(
            session,
            user_id=user.user_id,
            role=OrganizationMemberRole.OWNER,
            suffix="owner",
        )
        await session.commit()

    response = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Offre partenaire",
            "offer_type": "drink",
        },
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 201, response.text
    assert response.json()["offer_status"] == "draft"
    assert response.json()["is_active"] is False


@pytest.mark.asyncio
async def test_staff_cannot_create_offer(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _setup_verified_org_with_member(
            session,
            user_id=user.user_id,
            role=OrganizationMemberRole.STAFF,
            suffix="staff",
        )
        await session.commit()

    response = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Interdit",
            "offer_type": "drink",
        },
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unverified_org_cannot_create_offer(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org = Organization(
            slug="perm-pending-org",
            name="Pending",
            type=OrganizationType.COMMERCE,
            city="Reims",
            verification_status=VerificationStatus.PENDING,
            visibility=OrganizationVisibility.PRIVATE,
        )
        session.add(org)
        await session.flush()
        session.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=user.user_id,
                role=OrganizationMemberRole.OWNER,
                status=OrganizationMemberStatus.ACTIVE,
            )
        )
        await session.commit()
        org_id = org.id

    response = await auth_client.post(
        PARTNER_BASE,
        json={
            "organization_id": str(org_id),
            "title": "Pending org",
            "offer_type": "drink",
        },
        headers=auth_header(user.access_token),
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ORGANIZATION_NOT_VERIFIED"


@pytest.mark.asyncio
async def test_partner_offers_auth_required(auth_client: AsyncClient) -> None:
    response = await auth_client.get(PARTNER_BASE)
    assert response.status_code == 401
