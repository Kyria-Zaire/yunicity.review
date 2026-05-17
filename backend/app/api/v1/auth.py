"""Auth HTTP routes — thin layer over AuthService."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import is_mobile_client, require_authenticated_user
from app.core.errors import AppError
from app.core.rate_limit import enforce_rate_limit
from app.core.security import normalize_email
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthTokenResponse,
    LoginRequest,
    RefreshRequest,
    RefreshTokenResponse,
    RegisterRequest,
)
from app.schemas.user import UserPublic
from app.services.auth_service import AuthService, IssuedRefreshToken

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _set_refresh_cookie(response: Response, issued: IssuedRefreshToken, settings: Settings) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=issued.raw_token,
        max_age=issued.max_age_seconds,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path=settings.refresh_cookie_path,
    )


def _clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
    )


def _read_refresh_token(
    request: Request,
    body: RefreshRequest | None,
    settings: Settings,
) -> str | None:
    if body and body.refresh_token:
        return body.refresh_token
    return request.cookies.get(settings.refresh_cookie_name)


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mobile: Annotated[bool, Depends(is_mobile_client)],
) -> AuthTokenResponse:
    ip = _client_ip(request)
    await enforce_rate_limit(f"rl:register:ip:{ip}", limit=5, window_seconds=3600)

    service = AuthService(session, settings)
    bundle = await service.register(payload)
    _set_refresh_cookie(response, bundle.refresh, settings)
    return AuthTokenResponse(
        access_token=bundle.access_token,
        expires_in=bundle.expires_in,
        user=bundle.user,
        refresh_token=bundle.refresh.raw_token if mobile else None,
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mobile: Annotated[bool, Depends(is_mobile_client)],
) -> AuthTokenResponse:
    ip = _client_ip(request)
    email = normalize_email(str(payload.email))
    await enforce_rate_limit(f"rl:login:ip:{ip}", limit=10, window_seconds=900)
    await enforce_rate_limit(f"rl:login:email:{email}", limit=5, window_seconds=900)

    service = AuthService(session, settings)
    bundle = await service.login(payload)
    _set_refresh_cookie(response, bundle.refresh, settings)
    return AuthTokenResponse(
        access_token=bundle.access_token,
        expires_in=bundle.expires_in,
        user=bundle.user,
        refresh_token=bundle.refresh.raw_token if mobile else None,
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mobile: Annotated[bool, Depends(is_mobile_client)],
    body: RefreshRequest | None = None,
) -> RefreshTokenResponse:
    raw = _read_refresh_token(request, body, settings)
    if not raw:
        raise AppError(
            status_code=401,
            code="INVALID_REFRESH_TOKEN",
            detail="Session invalide ou expirée.",
        )

    service = AuthService(session, settings)
    token_response, issued = await service.refresh(raw)
    if issued is not None:
        _set_refresh_cookie(response, issued, settings)
    return RefreshTokenResponse(
        access_token=token_response.access_token,
        expires_in=token_response.expires_in,
        refresh_token=issued.raw_token if mobile and issued else None,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    body: RefreshRequest | None = None,
) -> None:
    raw = _read_refresh_token(request, body, settings)
    service = AuthService(session, settings)
    await service.logout(raw)
    _clear_refresh_cookie(response, settings)


@router.get("/me", response_model=UserPublic)
async def me(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserPublic:
    service = AuthService(session, settings)
    return await service.get_me(current_user.id)
