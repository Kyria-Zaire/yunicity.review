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
    response = await client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["checks"]["database"] == "disabled"
    assert data["checks"]["redis"] == "disabled"
