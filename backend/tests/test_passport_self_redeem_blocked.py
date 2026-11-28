"""PASSPORT-SELF-REDEEM-API-01 — la consommation d'une offre exige une validation partenaire.

Décision produit (Kyria, 2026-11-05). Un citoyen ne peut pas consommer seul une
offre : aucune utilisation, aucun Yuni, aucune réputation, aucune progression de
défi. La consultation des offres, la présentation du QR et le scan partenaire
restent intacts.
"""

from __future__ import annotations

import uuid
from typing import Any, cast

import pytest
from app.core.organization_constants import OrganizationMemberRole, OrganizationMemberStatus
from app.db.session import get_engine
from app.models.organization import OrganizationMember
from app.models.passport import Passport, PassportOfferRedemption
from app.models.passport_challenge import PassportChallengeProgressEvent
from app.models.passport_reputation import ReputationEvent
from app.models.yuni_wallet import YuniTransaction
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    register_user,
)

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _usine() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _effets(passport_id: uuid.UUID, user_id: uuid.UUID) -> tuple[int, int, int, int, int]:
    """(utilisations, compteur, transactions Yuni, événements de réputation, progression
    de défis) du citoyen."""
    async with _usine()() as session:
        utilisations = await session.scalar(
            select(func.count())
            .select_from(PassportOfferRedemption)
            .where(PassportOfferRedemption.passport_id == passport_id)
        )
        compteur = await session.scalar(
            select(Passport.redemptions_count).where(Passport.id == passport_id)
        )
        yuni = await session.scalar(
            select(func.count())
            .select_from(YuniTransaction)
            .where(YuniTransaction.user_id == user_id)
        )
        reputation = await session.scalar(
            select(func.count())
            .select_from(ReputationEvent)
            .where(ReputationEvent.user_id == user_id)
        )
        defis = await session.scalar(
            select(func.count())
            .select_from(PassportChallengeProgressEvent)
            .where(PassportChallengeProgressEvent.user_id == user_id)
        )
    return (
        int(utilisations or 0),
        int(compteur or 0),
        int(yuni or 0),
        int(reputation or 0),
        int(defis or 0),
    )


async def _scene(client: AsyncClient, suffix: str) -> dict[str, Any]:
    citoyen = await register_user(client, suffix=f"-selfredeem-{suffix}")
    passport = await activate_passport(client, citoyen["access_token"])
    async with _usine()() as session:
        org, offre = await create_verified_org_with_offer(
            session, slug_suffix=f"selfredeem-{suffix}"
        )
        await session.commit()
        org_id, offre_id = org.id, str(offre.id)
    return {
        "citoyen": citoyen,
        "passport_id": uuid.UUID(passport["id"]),
        "user_id": uuid.UUID(citoyen["user"]["id"]),
        "org_id": org_id,
        "offre_id": offre_id,
    }


async def test_auto_consommation_refusee_sans_effet(auth_client: AsyncClient) -> None:
    scene = await _scene(auth_client, "refus")
    avant = await _effets(scene["passport_id"], scene["user_id"])

    reponse = await auth_client.post(
        f"/api/v1/passport/offers/{scene['offre_id']}/redeem",
        headers=auth_header(scene["citoyen"]["access_token"]),
    )

    assert reponse.status_code == 403, reponse.text
    assert reponse.json()["code"] == "OFFER_PARTNER_VALIDATION_REQUIRED"
    assert await _effets(scene["passport_id"], scene["user_id"]) == avant


async def test_consultation_et_qr_intacts(auth_client: AsyncClient) -> None:
    scene = await _scene(auth_client, "consultation")
    jeton = scene["citoyen"]["access_token"]
    offres = await auth_client.get("/api/v1/passport/offers", headers=auth_header(jeton))
    assert offres.status_code == 200, offres.text
    assert any(o["id"] == scene["offre_id"] for o in offres.json()["items"])
    qr = await auth_client.get("/api/v1/passport/me/qr", headers=auth_header(jeton))
    assert qr.status_code == 200, qr.text
    assert qr.json()["qr_payload"].startswith("YNCP1:")


async def test_parcours_partenaire_consomme_avec_audit(auth_client: AsyncClient) -> None:
    scene = await _scene(auth_client, "partenaire")
    partenaire = cast(
        dict[str, Any],
        (
            await auth_client.post(
                "/api/v1/auth/register",
                json={
                    "email": "partner-selfredeem@example.com",
                    "password": "StrongPassword1!",
                    "full_name": "Partner Selfredeem",
                    "city": "Reims",
                },
            )
        ).json(),
    )
    async with _usine()() as session:
        session.add(
            OrganizationMember(
                organization_id=scene["org_id"],
                user_id=uuid.UUID(partenaire["user"]["id"]),
                role=OrganizationMemberRole.OWNER.value,
                status=OrganizationMemberStatus.ACTIVE.value,
            )
        )
        await session.commit()
    qr = await auth_client.get(
        "/api/v1/passport/me/qr", headers=auth_header(scene["citoyen"]["access_token"])
    )
    utilise = await auth_client.post(
        "/api/v1/scan/redeem",
        json={"qr_secret": qr.json()["qr_payload"], "offer_id": scene["offre_id"]},
        headers=auth_header(partenaire["access_token"]),
    )
    assert utilise.status_code == 200, utilise.text
    async with _usine()() as session:
        redemption = await session.scalar(
            select(PassportOfferRedemption).where(
                PassportOfferRedemption.passport_id == scene["passport_id"]
            )
        )
    assert redemption is not None
    assert redemption.metadata_ and "audit" in redemption.metadata_
