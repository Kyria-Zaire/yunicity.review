"""Partner scan & redemption tests (TICKET-306)."""

from __future__ import annotations

import uuid
from typing import Any, cast

import pytest
from app.core.organization_constants import OrganizationMemberRole, OrganizationMemberStatus
from app.core.passport_constants import PartnerOfferStatus
from app.db.session import get_engine
from app.models.organization import OrganizationMember
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    register_user,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _register_partner(client: AsyncClient, suffix: str) -> dict[str, Any]:
    body = {
        "email": f"partner-scan{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": "Partner Scanner",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _link_partner_to_org(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    role: OrganizationMemberRole = OrganizationMemberRole.OWNER,
) -> None:
    session.add(
        OrganizationMember(
            organization_id=org_id,
            user_id=user_id,
            role=role.value,
            status=OrganizationMemberStatus.ACTIVE.value,
        )
    )
    await session.flush()


@pytest.mark.asyncio
async def test_passport_me_qr(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-qr")
    await activate_passport(auth_client, citizen["access_token"])
    response = await auth_client.get(
        "/api/v1/passport/me/qr",
        headers=auth_header(citizen["access_token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["qr_payload"].startswith("YNCP1:")
    assert body["passport_number"].startswith("YUN-")
    assert body["expires_at"] is None


@pytest.mark.asyncio
async def test_scan_resolve_and_redeem_success(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-scan-ok")
    passport = await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-scan-ok")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offer = await create_verified_org_with_offer(
            session,
            slug_suffix="scan-ok",
            offer_title="Café offert scan",
        )
        await _link_partner_to_org(session, org_id=org.id, user_id=uuid.UUID(partner["user"]["id"]))
        await session.commit()
        offer_id = offer.id

    qr_response = await auth_client.get(
        "/api/v1/passport/me/qr",
        headers=auth_header(citizen["access_token"]),
    )
    qr_payload = qr_response.json()["qr_payload"]

    resolve = await auth_client.post(
        "/api/v1/scan/resolve",
        json={"qr_secret": qr_payload},
        headers=auth_header(partner["access_token"]),
    )
    assert resolve.status_code == 200, resolve.text
    resolve_body = resolve.json()
    assert resolve_body["passport"]["passport_number"] == passport["passport_number"]
    assert any(o["id"] == str(offer_id) for o in resolve_body["offers"])

    redeem = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr_payload, "offer_id": str(offer_id)},
        headers=auth_header(partner["access_token"]),
    )
    assert redeem.status_code == 200, redeem.text
    redeem_body = redeem.json()
    assert redeem_body["success"] is True
    assert redeem_body["offer_title"] == "Café offert scan"
    assert "succès" in redeem_body["message"].lower() or "validé" in redeem_body["message"].lower()

    duplicate = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr_payload, "offer_id": str(offer_id)},
        headers=auth_header(partner["access_token"]),
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "REDEMPTION_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_scan_org_isolation(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-iso")
    await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-iso")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_a, offer_a = await create_verified_org_with_offer(session, slug_suffix="iso-a")
        org_b, offer_b = await create_verified_org_with_offer(session, slug_suffix="iso-b")
        partner_id = uuid.UUID(partner["user"]["id"])
        await _link_partner_to_org(session, org_id=org_a.id, user_id=partner_id)
        await session.commit()
        offer_b_id = offer_b.id

    qr = (
        await auth_client.get(
            "/api/v1/passport/me/qr",
            headers=auth_header(citizen["access_token"]),
        )
    ).json()["qr_payload"]

    mismatch = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr, "offer_id": str(offer_b_id)},
        headers=auth_header(partner["access_token"]),
    )
    assert mismatch.status_code == 403


@pytest.mark.asyncio
async def test_scan_staff_role_forbidden(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-staff")
    await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-staff")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offer = await create_verified_org_with_offer(session, slug_suffix="staff-role")
        await _link_partner_to_org(
            session,
            org_id=org.id,
            user_id=uuid.UUID(partner["user"]["id"]),
            role=OrganizationMemberRole.STAFF,
        )
        await session.commit()
        offer_id = offer.id

    qr = (
        await auth_client.get(
            "/api/v1/passport/me/qr",
            headers=auth_header(citizen["access_token"]),
        )
    ).json()["qr_payload"]

    response = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr, "offer_id": str(offer_id)},
        headers=auth_header(partner["access_token"]),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_scan_manual_token_fallback(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-manual")
    passport = await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-manual")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offer = await create_verified_org_with_offer(session, slug_suffix="manual")
        await _link_partner_to_org(session, org_id=org.id, user_id=uuid.UUID(partner["user"]["id"]))
        await session.commit()

    manual_secret = passport["qr_token"]
    resolve = await auth_client.post(
        "/api/v1/scan/resolve",
        json={"qr_secret": manual_secret},
        headers=auth_header(partner["access_token"]),
    )
    assert resolve.status_code == 200


@pytest.mark.asyncio
async def test_scan_unpublished_offer_rejected(auth_client: AsyncClient) -> None:
    citizen = await register_user(auth_client, suffix="-draft")
    await activate_passport(auth_client, citizen["access_token"])
    partner = await _register_partner(auth_client, "-draft")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offer = await create_verified_org_with_offer(
            session,
            slug_suffix="draft-offer",
            offer_status=PartnerOfferStatus.DRAFT,
        )
        await _link_partner_to_org(session, org_id=org.id, user_id=uuid.UUID(partner["user"]["id"]))
        await session.commit()
        offer_id = offer.id

    qr = (
        await auth_client.get(
            "/api/v1/passport/me/qr",
            headers=auth_header(citizen["access_token"]),
        )
    ).json()["qr_payload"]

    response = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr, "offer_id": str(offer_id)},
        headers=auth_header(partner["access_token"]),
    )
    assert response.status_code == 410
    assert response.json()["code"] == "OFFER_NOT_PUBLISHED"


@pytest.mark.asyncio
async def test_scan_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": "YNCP1:test", "offer_id": str(uuid.uuid4())},
    )
    assert response.status_code == 401
