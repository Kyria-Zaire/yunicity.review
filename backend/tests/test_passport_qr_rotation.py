"""Rotation des jetons QR Passport (PASSPORT-QR-TOKEN-ROTATION-01).

Simulation sans écriture ; rotation de tous les Passports (tout statut) ;
ancien QR refusé / nouveau QR accepté au scan partenaire ; garde-fous du script ;
aucun jeton dans les sorties.
"""

from __future__ import annotations

import argparse
import uuid
from typing import Any, cast

import pytest
from app.core.organization_constants import OrganizationMemberRole, OrganizationMemberStatus
from app.core.passport_constants import PassportStatus
from app.db.session import get_engine
from app.models.organization import OrganizationMember
from app.models.passport import Passport
from app.services.passport_qr_rotation_service import PassportQrRotationService
from httpx import AsyncClient
from scripts.rotate_passport_qr_tokens import (
    build_parser,
    describe_target,
    format_report,
    guard_errors,
    target_errors,
)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_passport import (
    activate_passport,
    auth_header,
    create_verified_org_with_offer,
    register_user,
)


def _args(*argv: str) -> argparse.Namespace:
    return build_parser().parse_args(list(argv))


PREVIEW = {
    "RAILWAY_PROJECT_ID": "proj-preview",
    "RAILWAY_ENVIRONMENT_ID": "env-preview",
    "RAILWAY_SERVICE_ID": "svc-api-preview",
    "RAILWAY_PROJECT_NAME": "dazzling-wisdom",
    "RAILWAY_ENVIRONMENT_NAME": "production",
    "RAILWAY_SERVICE_NAME": "unified-media-preview",
}
CIBLE_PREVIEW = (
    "--expected-railway-project",
    "proj-preview",
    "--expected-railway-environment",
    "env-preview",
    "--expected-railway-service",
    "svc-api-preview",
)


class TestCiblageRailway:
    def test_simulation_sans_cible_autorisee(self) -> None:
        assert target_errors(_args(), PREVIEW) == []

    def test_simulation_avec_cible_conforme(self) -> None:
        assert target_errors(_args(*CIBLE_PREVIEW), PREVIEW) == []

    def test_simulation_refusee_si_autre_projet(self) -> None:
        autre = {**PREVIEW, "RAILWAY_PROJECT_ID": "proj-production"}
        erreurs = target_errors(_args(*CIBLE_PREVIEW), autre)
        assert len(erreurs) == 1 and "RAILWAY_PROJECT_ID" in erreurs[0]

    def test_execution_exige_les_trois_identifiants(self) -> None:
        assert len(target_errors(_args("--execute"), PREVIEW)) == 3

    def test_execution_refusee_hors_railway(self) -> None:
        assert len(target_errors(_args("--execute", *CIBLE_PREVIEW), {})) == 3

    def test_description_lisible_sans_secret(self) -> None:
        texte = describe_target(PREVIEW)
        assert "dazzling-wisdom" in texte and "svc-api-preview" in texte


class TestGardeFous:
    def test_simulation_toujours_autorisee(self) -> None:
        assert guard_errors(_args(), database_name="preview", total=3) == []

    def test_execution_exige_base_et_nombre(self) -> None:
        erreurs = guard_errors(_args("--execute"), database_name="preview", total=3)
        assert len(erreurs) == 2

    def test_execution_refusee_si_mauvaise_base(self) -> None:
        erreurs = guard_errors(
            _args("--execute", "--expected-database", "autre", "--expected-count", "3"),
            database_name="preview",
            total=3,
        )
        assert erreurs and "autre" in erreurs[0]

    def test_execution_refusee_si_nombre_different(self) -> None:
        erreurs = guard_errors(
            _args("--execute", "--expected-database", "preview", "--expected-count", "4"),
            database_name="preview",
            total=3,
        )
        assert erreurs and "3 Passports" in erreurs[0]

    def test_execution_autorisee_si_tout_correspond(self) -> None:
        assert (
            guard_errors(
                _args("--execute", "--expected-database", "preview", "--expected-count", "3"),
                database_name="preview",
                total=3,
            )
            == []
        )


async def _partenaire(client: AsyncClient, suffix: str) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"partner-rotation{suffix}@example.com",
            "password": "StrongPassword1!",
            "full_name": "Partner Rotation",
            "city": "Reims",
        },
    )
    assert response.status_code == 201, response.text
    return cast(dict[str, Any], response.json())


async def _jetons(session: AsyncSession) -> dict[uuid.UUID, str]:
    rows = (await session.execute(select(Passport.id, Passport.qr_token))).all()
    return {row[0]: row[1] for row in rows}


async def _qr(client: AsyncClient, token: str) -> str:
    response = await client.get("/api/v1/passport/me/qr", headers=auth_header(token))
    assert response.status_code == 200, response.text
    return cast(str, response.json()["qr_payload"])


async def _resolve(
    client: AsyncClient, partner_token: str, qr_payload: str
) -> tuple[int, str | None]:
    response = await client.post(
        "/api/v1/scan/resolve",
        json={"qr_secret": qr_payload},
        headers=auth_header(partner_token),
    )
    return response.status_code, response.json().get("code")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_simulation_puis_rotation_ancien_qr_refuse_nouveau_accepte(
    auth_client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    citoyen_a = await register_user(auth_client, suffix="-rot-a")
    citoyen_b = await register_user(auth_client, suffix="-rot-b")
    await activate_passport(auth_client, citoyen_a["access_token"])
    passport_b = await activate_passport(auth_client, citoyen_b["access_token"])
    partenaire = await _partenaire(auth_client, "-rot")

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org, _ = await create_verified_org_with_offer(session, slug_suffix="rotation")
        session.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=uuid.UUID(partenaire["user"]["id"]),
                role=OrganizationMemberRole.OWNER.value,
                status=OrganizationMemberStatus.ACTIVE.value,
            )
        )
        await session.commit()

    ancien_a = await _qr(auth_client, citoyen_a["access_token"])
    ancien_b = await _qr(auth_client, citoyen_b["access_token"])
    assert await _resolve(auth_client, partenaire["access_token"], ancien_a) == (200, None)

    # Passport B suspendu : il doit AUSSI changer de jeton (réactivation possible).
    async with factory() as session:
        await session.execute(
            update(Passport)
            .where(Passport.id == uuid.UUID(passport_b["id"]))
            .values(status=PassportStatus.SUSPENDED.value)
        )
        await session.commit()

    # 1. Simulation : compte, n'écrit rien.
    async with factory() as session:
        avant = await _jetons(session)
        simulation = await PassportQrRotationService(session).preview()
        await session.rollback()
    assert simulation.rotated == 0
    assert simulation.total == len(avant) >= 2
    assert simulation.counts_by_status.get(PassportStatus.SUSPENDED.value, 0) >= 1
    async with factory() as session:
        assert await _jetons(session) == avant
    assert await _resolve(auth_client, partenaire["access_token"], ancien_a) == (200, None)

    # 2. Rotation.
    async with factory() as session:
        rapport = await PassportQrRotationService(session).rotate_all()
        await session.commit()
    assert rapport.rotated == rapport.total == len(avant)

    async with factory() as session:
        apres = await _jetons(session)
    assert set(apres) == set(avant)
    assert all(apres[pid] != avant[pid] for pid in avant), (
        "chaque Passport, tout statut, change de jeton"
    )
    assert len(set(apres.values())) == len(apres), "jetons uniques"

    # 3. Ancien QR refusé, nouveau QR accepté.
    assert await _resolve(auth_client, partenaire["access_token"], ancien_a) == (
        404,
        "PASSPORT_NOT_FOUND",
    )
    nouveau_a = await _qr(auth_client, citoyen_a["access_token"])
    assert nouveau_a != ancien_a
    assert await _resolve(auth_client, partenaire["access_token"], nouveau_a) == (200, None)

    # 4. Aucun jeton (ancien ou nouveau) dans les journaux ni dans le rapport.
    sortie = format_report(rapport, database_name="test", mode="execution") + caplog.text
    for jeton in [*avant.values(), *apres.values(), ancien_b]:
        assert jeton.removeprefix("YNCP1:") not in sortie
