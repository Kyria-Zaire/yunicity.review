from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
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
    checks = ReadyChecks(database=db_status, redis=redis_status)
    degraded = any(status == "error" for status in (db_status, redis_status))
    return ReadyResponse(
        status="degraded" if degraded else "ready",
        checks=checks,
    )
