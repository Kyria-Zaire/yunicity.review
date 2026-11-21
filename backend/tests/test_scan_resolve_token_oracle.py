"""SCAN-RESOLVE-TOKEN-ORACLE-01 — le scan ne doit pas révéler la validité d'un jeton.

Un utilisateur connecté qui ne gère aucune organisation vérifiée reçoit la MÊME
réponse pour un jeton Passport existant ou inexistant, sur ``/scan/resolve`` et
``/scan/redeem``. Le parcours partenaire reste inchangé.
"""

from __future__ import annotations

import uuid
from typing import Any, cast

import pytest
from app.core.organization_constants import OrganizationMemberRole, OrganizationMemberStatus
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

JETON_INEXISTANT = "YNCP1:qr_ph_inexistant-0000000000000000000000"


async def _inscrire(client: AsyncClient, email: str) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword1!",
            "full_name": "Scan Oracle",
            "city": "Reims",
        },
    )
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _scene(client: AsyncClient, suffix: str) -> dict[str, Any]:
    """Citoyen avec Passport, partenaire gestionnaire d'une organisation vérifiée,
    utilisateur connecté sans organisation."""
    citoyen = await register_user(client, suffix=f"-oracle-{suffix}")
    await activate_passport(client, citoyen["access_token"])
    partenaire = await _inscrire(client, f"partner-oracle-{suffix}@example.com")
    intrus = await _inscrire(client, f"intrus-oracle-{suffix}@example.com")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, offre = await create_verified_org_with_offer(session, slug_suffix=f"oracle-{suffix}")
        session.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=uuid.UUID(partenaire["user"]["id"]),
                role=OrganizationMemberRole.OWNER.value,
                status=OrganizationMemberStatus.ACTIVE.value,
            )
        )
        await session.commit()
        offre_id = str(offre.id)

    qr = await client.get("/api/v1/passport/me/qr", headers=auth_header(citoyen["access_token"]))
    assert qr.status_code == 200, qr.text
    return {
        "jeton": qr.json()["qr_payload"],
        "offre_id": offre_id,
        "partenaire": partenaire["access_token"],
        "intrus": intrus["access_token"],
    }


async def _post(client: AsyncClient, chemin: str, jeton_acces: str, corps: dict[str, Any]) -> Any:
    return await client.post(f"/api/v1/scan/{chemin}", json=corps, headers=auth_header(jeton_acces))


async def test_resolve_non_autorise_meme_reponse_jeton_existant_ou_non(
    auth_client: AsyncClient,
) -> None:
    scene = await _scene(auth_client, "resolve")
    existant = await _post(auth_client, "resolve", scene["intrus"], {"qr_secret": scene["jeton"]})
    inexistant = await _post(
        auth_client, "resolve", scene["intrus"], {"qr_secret": JETON_INEXISTANT}
    )
    assert (existant.status_code, inexistant.status_code) == (403, 403)
    assert existant.json() == inexistant.json()
    assert existant.json()["code"] == "SCAN_PARTNER_FORBIDDEN"


async def test_redeem_non_autorise_meme_reponse_jeton_existant_ou_non(
    auth_client: AsyncClient,
) -> None:
    scene = await _scene(auth_client, "redeem")
    for offre_id in (scene["offre_id"], str(uuid.uuid4())):
        existant = await _post(
            auth_client,
            "redeem",
            scene["intrus"],
            {"qr_secret": scene["jeton"], "offer_id": offre_id},
        )
        inexistant = await _post(
            auth_client,
            "redeem",
            scene["intrus"],
            {"qr_secret": JETON_INEXISTANT, "offer_id": offre_id},
        )
        assert (existant.status_code, inexistant.status_code) == (403, 403), offre_id
        assert existant.json() == inexistant.json()
        assert existant.json()["code"] == "SCAN_PARTNER_FORBIDDEN"


async def test_parcours_partenaire_inchange(auth_client: AsyncClient) -> None:
    scene = await _scene(auth_client, "partenaire")
    resolu = await _post(auth_client, "resolve", scene["partenaire"], {"qr_secret": scene["jeton"]})
    assert resolu.status_code == 200, resolu.text
    assert any(o["id"] == scene["offre_id"] for o in resolu.json()["offers"])

    inconnu = await _post(
        auth_client, "resolve", scene["partenaire"], {"qr_secret": JETON_INEXISTANT}
    )
    assert (inconnu.status_code, inconnu.json()["code"]) == (404, "PASSPORT_NOT_FOUND")

    utilise = await _post(
        auth_client,
        "redeem",
        scene["partenaire"],
        {"qr_secret": scene["jeton"], "offer_id": scene["offre_id"]},
    )
    assert utilise.status_code == 200, utilise.text
    assert utilise.json()["success"] is True
