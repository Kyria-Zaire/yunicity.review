from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.registration_mode import registration_config_problems
from app.db.session import check_database
from app.integrations.redis import check_redis

router = APIRouter(tags=["health"])

CheckStatus = Literal["ok", "disabled", "error"]
ReadinessStatus = Literal["ready", "degraded"]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    environment: str


class ReadyChecks(BaseModel):
    database: CheckStatus
    redis: CheckStatus
    #: Reglages indispensables manquants pour le mode d'inscription en vigueur.
    #: Des NOMS de variables, jamais de valeur : ce diagnostic est destine a
    #: l'exploitation et ne doit rien reveler de la configuration elle-meme.
    registration_config: list[str] = []


class ReadyResponse(BaseModel):
    status: ReadinessStatus
    checks: ReadyChecks


@router.get("/health", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="yunicity-api",
        environment=settings.app_env,
    )


@router.get("/ready", response_model=ReadyResponse)
async def readiness() -> ReadyResponse:
    db_status = await check_database()
    redis_status = await check_redis()
    manquants = registration_config_problems(get_settings())
    checks = ReadyChecks(database=db_status, redis=redis_status, registration_config=manquants)
    degraded = any(status == "error" for status in (db_status, redis_status)) or bool(manquants)
    return ReadyResponse(
        status="degraded" if degraded else "ready",
        checks=checks,
    )
