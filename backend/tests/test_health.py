import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "yunicity-api"
    assert data["environment"] in ("dev", "recette", "preprod", "prod")


@pytest.mark.asyncio
async def test_ready_without_db_or_redis_returns_200(client: AsyncClient) -> None:
    """Rien de configuré : `/ready` répond quand même 200.

    Le code HTTP est ce que lit un orchestrateur ; `status` n'est qu'un
    diagnostic. Les confondre ferait retirer du trafic une instance parfaitement
    capable de servir les comptes existants — c'est la convention du projet, et
    AUTH-04B ne la change pas.
    """
    response = await client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["checks"]["database"] == "disabled"
    assert data["checks"]["redis"] == "disabled"


@pytest.mark.asyncio
async def test_a_200_on_ready_never_proves_that_registration_can_open(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Un pilote sans échéance ne peut pas ouvrir, et `/ready` le nomme.

    Mais il répond quand même 200 : le code HTTP protège la connexion des
    comptes existants, qui n'ont rien à voir avec l'inscription. Un futur outil
    d'ouverture qui se contenterait du 200 se tromperait donc — la seule preuve
    d'ouvrabilité est `checks.registration_config == []`.

    Le pilote incomplet est DÉCLARÉ ici, jamais hérité : compter sur le mode du
    conteneur ferait dépendre le résultat de l'endroit où la suite tourne — vert
    sur un runner nu, rouge dans la pile QA qui déclare `closed`.

    L'assertion porte sur l'APPARTENANCE, pas sur la liste exacte : le reste
    dépend de ce que l'environnement fournit par ailleurs (pepper, Redis). Les
    listes exactes sont épinglées là où elles sont déterministes, dans
    `test_registration_cutoff.py`.
    """
    from app.core.config import get_settings

    monkeypatch.setenv("REGISTRATION_MODE", "pilot")
    monkeypatch.delenv("REGISTRATION_CLOSES_AT", raising=False)
    get_settings.cache_clear()

    response = await client.get("/api/v1/ready")
    assert response.status_code == 200, "l'API reste joignable même si l'inscription ne peut ouvrir"

    data = response.json()
    manquants = data["checks"]["registration_config"]
    assert "REGISTRATION_CLOSES_AT" in manquants, "un pilote sans échéance doit être signalé"
    assert all("TURNSTILE" not in nom for nom in manquants), "Turnstile n'est jamais exigé en PILOT"
    assert data["status"] == "degraded", "une ouverture impossible ne doit pas se lire « ready »"
