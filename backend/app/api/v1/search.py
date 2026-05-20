"""Local search routes (FEATURE-B / TICKET-B.4)."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_optional
from app.core.errors import AppError
from app.core.rate_limit import enforce_rate_limit
from app.core.search_constants import (
    SEARCH_ENTITY_TYPES,
    SEARCH_LIMIT_DEFAULT,
    SEARCH_LIMIT_MAX,
    SEARCH_PERIODS,
    SEARCH_RATE_LIMIT,
    SEARCH_RATE_WINDOW_SECONDS,
    SearchEntityType,
    SearchPeriod,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _parse_entity_type(raw: str | None) -> SearchEntityType | Literal["all"]:
    if raw is None or raw.strip().lower() == "all":
        return "all"
    normalized = raw.strip().lower()
    if normalized not in SEARCH_ENTITY_TYPES:
        raise AppError(
            status_code=400,
            code="INVALID_SEARCH_TYPE",
            detail="Type de recherche inconnu.",
        )
    return SearchEntityType(normalized)


def _parse_period(raw: str | None) -> SearchPeriod:
    if raw is None:
        return SearchPeriod.UPCOMING
    normalized = raw.strip().lower()
    if normalized not in SEARCH_PERIODS:
        raise AppError(
            status_code=400,
            code="INVALID_PERIOD",
            detail="Période invalide.",
        )
    return SearchPeriod(normalized)


@router.get("", response_model=SearchResponse)
async def search_local(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    q: str = Query(min_length=1, max_length=120),
    city: str | None = Query(default=None, max_length=128),
    neighborhood_slug: str | None = Query(default=None, max_length=80),
    type: str | None = Query(default=None, alias="type"),
    period: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=SEARCH_LIMIT_DEFAULT, ge=1, le=SEARCH_LIMIT_MAX),
) -> SearchResponse:
    rate_key = (
        f"rl:search:user:{current_user.id}"
        if current_user is not None
        else f"rl:search:ip:{_client_ip(request)}"
    )
    await enforce_rate_limit(
        rate_key,
        limit=SEARCH_RATE_LIMIT,
        window_seconds=SEARCH_RATE_WINDOW_SECONDS,
    )
    entity_type = _parse_entity_type(type)
    search_period = _parse_period(period)
    return await SearchService(session).search(
        raw_query=q,
        city=city,
        neighborhood_slug=neighborhood_slug,
        entity_type=entity_type,
        period=search_period,
        page=page,
        limit=limit,
        viewer=current_user,
    )
