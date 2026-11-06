"""Passport API test helpers."""

from __future__ import annotations

import uuid
from typing import Any, cast

from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.core.passport_constants import PartnerOfferStatus, PartnerOfferType
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from app.models.passport import PartnerOffer
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


async def register_user(client: AsyncClient, *, suffix: str = "") -> dict[str, Any]:
    body = {
        "email": f"passport{suffix}@example.com",
        "password": "StrongPassword1!",
        "full_name": "Passport Citizen",
        "city": "Reims",
    }
    response = await client.post("/api/v1/auth/register", json=body)
    assert response.status_code == 201, response.text
    data: dict[str, Any] = response.json()
    return data


async def activate_passport(
    client: AsyncClient,
    token: str,
    *,
    city: str | None = None,
) -> dict[str, Any]:
    payload = {} if city is None else {"city": city}
    response = await client.post(
        "/api/v1/passport/activate",
        json=payload,
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    data: dict[str, Any] = response.json()
    return data


async def create_verified_org_with_offer(
    session: AsyncSession,
    *,
    slug_suffix: str,
    offer_title: str = "Café offert",
    visibility: OrganizationVisibility = OrganizationVisibility.PUBLIC,
    verification_status: VerificationStatus = VerificationStatus.VERIFIED,
    offer_status: PartnerOfferStatus = PartnerOfferStatus.PUBLISHED,
) -> tuple[Organization, PartnerOffer]:
    org = Organization(
        slug=f"partner-{slug_suffix}",
        name=f"Partner {slug_suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=verification_status,
        visibility=visibility,
    )
    session.add(org)
    await session.flush()
    # The public offer catalog joins PartnerProfile and requires a public partner status
    # (see _public_catalog_filters): being a verified organization is not enough. Always
    # attach the profile — including for unverified/private orgs — so exclusion from the
    # catalog is proven by verification_status/visibility, never by a missing profile.
    session.add(
        PartnerProfile(
            organization_id=org.id,
            partnership_type=PartnershipType.LOCAL_BUSINESS,
            partner_status=PartnerStatus.ACTIVE,
        )
    )
    await session.flush()
    offer = PartnerOffer(
        organization_id=org.id,
        title=offer_title,
        description="Offre test",
        offer_type=PartnerOfferType.DRINK,
        status=offer_status,
        is_active=offer_status == PartnerOfferStatus.PUBLISHED,
    )
    session.add(offer)
    await session.flush()
    return org, offer


async def create_unverified_org_with_active_offer(
    session: AsyncSession,
    *,
    slug_suffix: str,
) -> PartnerOffer:
    _, offer = await create_verified_org_with_offer(
        session,
        slug_suffix=slug_suffix,
        verification_status=VerificationStatus.PENDING,
        visibility=OrganizationVisibility.PRIVATE,
    )
    return offer


async def register_partner_for_org(
    client: AsyncClient,
    session: AsyncSession,
    *,
    organization_id: uuid.UUID,
    suffix: str,
) -> dict[str, Any]:
    """Inscrit un partenaire et le rend gestionnaire (owner actif) de l'organisation."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"partner{suffix}@example.com",
            "password": "StrongPassword1!",
            "full_name": "Partner Scanner",
            "city": "Reims",
        },
    )
    assert response.status_code == 201, response.text
    partner = cast(dict[str, Any], response.json())
    session.add(
        OrganizationMember(
            organization_id=organization_id,
            user_id=uuid.UUID(partner["user"]["id"]),
            role=OrganizationMemberRole.OWNER.value,
            status=OrganizationMemberStatus.ACTIVE.value,
        )
    )
    await session.flush()
    return partner


async def partner_redeem(
    client: AsyncClient,
    *,
    partner_token: str,
    citizen_token: str,
    offer_id: uuid.UUID | str,
) -> Any:
    """Validation d'une offre par le parcours partenaire : QR du citoyen puis ``/scan/redeem``."""
    qr = await client.get("/api/v1/passport/me/qr", headers=auth_header(citizen_token))
    assert qr.status_code == 200, qr.text
    return await client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr.json()["qr_payload"], "offer_id": str(offer_id)},
        headers=auth_header(partner_token),
    )
