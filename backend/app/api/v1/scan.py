"""Partner scan & redemption routes (TICKET-306)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.scan import (
    ScanRedeemRequest,
    ScanRedeemResponse,
    ScanResolveRequest,
    ScanResolveResponse,
)
from app.services.scan_redemption_service import ScanRedemptionService

router = APIRouter(prefix="/scan", tags=["scan"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/resolve", response_model=ScanResolveResponse)
async def resolve_passport_scan(
    payload: ScanResolveRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ScanResolveResponse:
    await enforce_rate_limit(
        f"scan:resolve:{current_user.id}",
        limit=60,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"scan:resolve:ip:{_client_ip(request)}",
        limit=120,
        window_seconds=3600,
    )
    return await ScanRedemptionService(session).resolve_for_partner(
        current_user,
        payload.qr_secret,
        client_ip=_client_ip(request),
    )


@router.post("/redeem", response_model=ScanRedeemResponse)
async def redeem_passport_scan(
    payload: ScanRedeemRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ScanRedeemResponse:
    await enforce_rate_limit(
        f"scan:redeem:{current_user.id}",
        limit=40,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        f"scan:redeem:ip:{_client_ip(request)}",
        limit=80,
        window_seconds=3600,
    )
    return await ScanRedemptionService(session).redeem_for_partner(
        current_user,
        offer_id=payload.offer_id,
        qr_secret=payload.qr_secret,
        client_ip=_client_ip(request),
    )
