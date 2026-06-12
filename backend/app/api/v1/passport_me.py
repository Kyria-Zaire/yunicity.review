"""Citizen Passport identity API (PASSPORT-05A)."""

from __future__ import annotations

from typing import Annotated, NoReturn

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.errors import AppError
from app.core.passport_challenge_reward_errors import (
    ChallengeNotCompletedError,
    ChallengeNotFoundError,
    ChallengeRewardWalletError,
    PassportChallengeRewardError,
    UserChallengeNotFoundError,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.passport_me import (
    ChallengeClaimResponse,
    PassportBadgesResponse,
    PassportChallengesResponse,
    PassportOverviewResponse,
)
from app.services.passport_me_service import PassportMeService

router = APIRouter(prefix="/me/passport", tags=["passport-me"])


def _raise_challenge_reward_error(exc: PassportChallengeRewardError) -> NoReturn:
    if isinstance(exc, ChallengeNotFoundError):
        raise AppError(
            status_code=404,
            code="PASSPORT_CHALLENGE_NOT_FOUND",
            detail="Défi introuvable.",
        ) from exc
    if isinstance(exc, UserChallengeNotFoundError):
        raise AppError(
            status_code=404,
            code="PASSPORT_CHALLENGE_NOT_STARTED",
            detail="Ce défi n'a pas encore été commencé.",
        ) from exc
    if isinstance(exc, ChallengeNotCompletedError):
        raise AppError(
            status_code=400,
            code="PASSPORT_CHALLENGE_NOT_COMPLETED",
            detail="Ce défi n'est pas encore terminé.",
        ) from exc
    if isinstance(exc, ChallengeRewardWalletError):
        raise AppError(
            status_code=403,
            code="YUNI_WALLET_SUSPENDED",
            detail=str(exc),
        ) from exc
    raise AppError(
        status_code=400,
        code="PASSPORT_CHALLENGE_REWARD_ERROR",
        detail=str(exc),
    ) from exc


@router.get("", response_model=PassportOverviewResponse)
async def get_passport_overview(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportOverviewResponse:
    return await PassportMeService(session).get_overview(current_user)


@router.get("/badges", response_model=PassportBadgesResponse)
async def get_passport_badges(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportBadgesResponse:
    return await PassportMeService(session).get_badges(current_user)


@router.get("/challenges", response_model=PassportChallengesResponse)
async def get_passport_challenges(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PassportChallengesResponse:
    return await PassportMeService(session).get_challenges(current_user)


@router.post(
    "/challenges/{challenge_code}/claim",
    response_model=ChallengeClaimResponse,
)
async def claim_passport_challenge_reward(
    challenge_code: str,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ChallengeClaimResponse:
    service = PassportMeService(session)
    try:
        return await service.claim_challenge_reward(current_user, challenge_code)
    except PassportChallengeRewardError as exc:
        _raise_challenge_reward_error(exc)
