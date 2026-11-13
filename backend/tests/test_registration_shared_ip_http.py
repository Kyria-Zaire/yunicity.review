"""Cent personnes, une seule IP — AUTH-04A-CORRECTION-02.

Le parcours HTTP complet, pas seulement le limiteur. C'est le cas qui a motivé
tout le ticket : une présentation où une salle entière s'inscrit depuis le même
réseau, donc derrière une seule adresse publique.

Deux propriétés sont démontrées ici :

1. **L'IP ne refuse personne.** Cent soumissions depuis la même adresse doivent
   toutes aboutir, ni la rafale ni l'horaire ne devant mordre.
2. **Le plafond global, lui, mord.** La 101ᵉ est refusée — et par le plafond
   global, pas par l'IP, ce que le test distingue explicitement.

Aucun appel réseau réel : l'envoi d'e-mail et Turnstile sont interceptés.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

#: Une seule IP publique, comme derrière le NAT d'un établissement.
_IP_PARTAGEE = "203.0.113.42"
_MOT_DE_PASSE = "MotDePasseSolide1!"


@pytest.fixture(autouse=True)
def no_outbound_calls(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Aucun e-mail réel, aucun appel Cloudflare."""
    envoyes: list[str] = []

    async def _capture(*, to: str, **_k: Any) -> None:
        envoyes.append(to)

    monkeypatch.setattr(
        "app.services.email_verification_service.send_email_verification_email", _capture
    )
    return envoyes


def _payload(rang: int) -> dict[str, str]:
    return {
        "email": f"salle-{rang}-{uuid.uuid4().hex[:6]}@example.com",
        "password": _MOT_DE_PASSE,
        "full_name": f"Participant {rang}",
        "city": "Reims",
    }


async def _inscrire(client: AsyncClient, rang: int) -> Any:
    return await client.post(
        "/api/v1/auth/register",
        json=_payload(rang),
        headers={"X-Forwarded-For": _IP_PARTAGEE},
    )


async def test_one_hundred_people_behind_one_ip_all_register(
    auth_client: AsyncClient,
) -> None:
    """Cent adresses distinctes, une seule IP, dans la même fenêtre."""
    codes: list[int] = []
    for rang in range(100):
        reponse = await _inscrire(auth_client, rang)
        codes.append(reponse.status_code)

    refus_ip = [c for c in codes if c == 429]
    assert refus_ip == [], (
        f"{len(refus_ip)} inscriptions refusees par une limite : "
        "l'IP ne doit jamais bloquer une salle entiere"
    )
    assert all(code in (201, 202) for code in codes), f"codes obtenus : {sorted(set(codes))}"


async def test_the_hundred_and_first_is_refused_by_the_global_ceiling(
    auth_client: AsyncClient,
) -> None:
    """La 101ᵉ est refusée — et c'est bien le plafond global qui l'arrête.

    La distinction compte : l'IP autorise 200/h, la rafale 120/min. Si le refus
    venait d'elles, la correction n'aurait pas atteint son but.
    """
    for rang in range(100):
        reponse = await _inscrire(auth_client, rang)
        assert reponse.status_code in (201, 202), f"blocage premature au rang {rang}"

    debordement = await _inscrire(auth_client, 100)

    assert debordement.status_code == 429
    assert debordement.json()["code"] == "RATE_LIMITED"

    # Preuve que l'IP n'est pas en cause : une AUTRE adresse IP est refusee de la
    # meme facon, puisque le plafond global ne depend pas de l'IP.
    depuis_ailleurs = await auth_client.post(
        "/api/v1/auth/register",
        json=_payload(101),
        headers={"X-Forwarded-For": "198.51.100.7"},
    )
    assert depuis_ailleurs.status_code == 429, (
        "le refus doit venir du plafond global, donc s'appliquer a toute IP"
    )


async def test_a_weak_password_does_not_consume_the_address_quota(
    auth_client: AsyncClient,
) -> None:
    """Une faute de frappe ne doit rien coûter au quota journalier de l'adresse."""
    adresse = f"frappe-{uuid.uuid4().hex[:8]}@example.com"
    base = {"email": adresse, "full_name": "Erreur Frappe", "city": "Reims"}

    # Bien plus que le plafond de 10 : si le compteur etait consomme, la derniere
    # tentative serait refusee par une limite au lieu de la politique de mot de passe.
    for _ in range(15):
        faible = await auth_client.post(
            "/api/v1/auth/register",
            json={**base, "password": "123456"},
            headers={"X-Forwarded-For": _IP_PARTAGEE},
        )
        assert faible.status_code == 422
        assert faible.json()["code"] == "WEAK_PASSWORD"

    # Le mot de passe corrige doit encore passer.
    correct = await auth_client.post(
        "/api/v1/auth/register",
        json={**base, "password": _MOT_DE_PASSE},
        headers={"X-Forwarded-For": _IP_PARTAGEE},
    )
    assert correct.status_code in (201, 202), (
        f"refuse en {correct.status_code} : le quota d'adresse a ete consomme par des "
        "erreurs de saisie"
    )


async def test_an_account_stays_recoverable_when_the_email_cannot_be_sent(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Aucune file de reprise n'existe : le message ne doit donc pas en promettre une.

    Le compte et son jeton restent valides, la réponse annonce l'indisponibilité
    plutôt qu'un envoi, et un renvoi ultérieur reste possible.
    """
    from app.integrations.resend_email import EmailDeliveryError

    async def _echec(**_k: Any) -> None:
        raise EmailDeliveryError("provider down")

    monkeypatch.setattr(
        "app.services.email_verification_service.send_email_verification_email", _echec
    )

    charge = _payload(500)
    reponse = await auth_client.post(
        "/api/v1/auth/register", json=charge, headers={"X-Forwarded-For": _IP_PARTAGEE}
    )

    # Le compte est bien créé malgré la panne d'envoi.
    assert reponse.status_code in (201, 202), reponse.text
    corps = reponse.json()

    if reponse.status_code == 202:
        assert corps["verification_email_sent"] is False
        assert "momentanément indisponible" in corps["message"]
        assert "vous a été envoyé" not in corps["message"], (
            "ne jamais annoncer un envoi qui n'a pas eu lieu"
        )

    # Le renvoi reste offert et répond sa phrase générique habituelle.
    renvoi = await auth_client.post(
        "/api/v1/auth/resend-verification",
        json={"email": charge["email"]},
        headers={"X-Forwarded-For": _IP_PARTAGEE},
    )
    assert renvoi.status_code == 200

    # Et la connexion reste refusée tant que l'adresse n'est pas confirmée, quand
    # l'exigence s'applique : une panne d'envoi n'ouvre aucun acces.
    if reponse.status_code == 202:
        connexion = await auth_client.post(
            "/api/v1/auth/login",
            json={"email": charge["email"], "password": _MOT_DE_PASSE},
        )
        assert connexion.status_code == 403
        assert connexion.json()["code"] == "EMAIL_NOT_VERIFIED"
