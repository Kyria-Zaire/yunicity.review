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
async def test_ready_names_the_settings_that_prevent_a_pilot_from_opening(
    client: AsyncClient,
) -> None:
    """AUTH-04B : sans `REGISTRATION_MODE`, l'environnement retombe sur PILOT.

    Un pilote sans échéance, sans pepper et sans Redis ne peut pas ouvrir. Le
    diagnostic le dit d'un coup et par NOMS de variables — jamais par valeurs,
    et sans se contenter d'une liste vide qui laisserait croire l'inverse.
    """
    data = (await client.get("/api/v1/ready")).json()

    assert data["checks"]["registration_config"] == [
        "REGISTRATION_CLOSES_AT",
        "RATE_LIMIT_KEY_PEPPER",
        "REDIS_URL",
    ]
    assert data["status"] == "degraded", "une ouverture impossible ne doit pas se lire « ready »"
