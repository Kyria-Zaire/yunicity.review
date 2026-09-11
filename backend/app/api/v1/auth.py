"""Auth HTTP routes — thin layer over AuthService."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import is_mobile_client, require_authenticated_user
from app.core.errors import AppError
from app.core.rate_limit import enforce_rate_limit, rate_limit_identity
from app.core.registration_mode import RegistrationPolicy, resolve_registration_policy
from app.core.security import normalize_email
from app.db.session import get_db
from app.integrations.turnstile import TurnstileUnavailable, verify_turnstile_token
from app.models.user import User
from app.schemas.auth import (
    AuthTokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegistrationPendingResponse,
    RegistrationStatusResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.schemas.user import UserPublic
from app.services.auth_service import AuthService, IssuedRefreshToken
from app.services.email_verification_service import EmailVerificationService
from app.services.password_reset_service import PasswordResetService

logger = logging.getLogger(__name__)

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


async def _require_turnstile(
    payload: RegisterRequest,
    request: Request,
    *,
    settings: Settings,
    policy: RegistrationPolicy,
) -> None:
    """Valide le défi anti-robot quand le mode l'exige.

    Le message rendu est volontairement identique pour un jeton absent, expiré,
    rejoué ou refusé : le détail du motif sert aux métriques, pas à l'attaquant,
    et un utilisateur n'a de toute façon qu'une seule action — recommencer.
    """
    if not policy.turnstile_required:
        return

    try:
        verdict = await verify_turnstile_token(
            payload.turnstile_token or "",
            settings=settings,
            remote_ip=_client_ip(request),
            expected_action="register",
        )
    except TurnstileUnavailable:
        # Fail-CLOSED : en mode PUBLIC le defi est une protection indispensable.
        # Laisser passer pendant une panne du fournisseur reviendrait a offrir a
        # un robot une fenetre ou il suffit d'attendre.
        logger.warning("turnstile_unavailable mode=%s", policy.mode.value)
        raise AppError(
            status_code=503,
            code="VERIFICATION_UNAVAILABLE",
            detail=(
                "La vérification de sécurité est momentanément indisponible. "
                "Réessayez dans quelques instants."
            ),
        ) from None

    if not verdict.success:
        logger.info("turnstile_rejected codes=%s", ",".join(verdict.codes))
        raise AppError(
            status_code=403,
            code="VERIFICATION_FAILED",
            detail=(
                "La vérification de sécurité n'a pas abouti. "
                "Réessayez : vos informations sont conservées."
            ),
        )


def _read_refresh_token(
    request: Request,
    body: RefreshRequest | None,
    settings: Settings,
) -> str | None:
    if body and body.refresh_token:
        return body.refresh_token
    return request.cookies.get(settings.refresh_cookie_name)


@router.get("/registration-status", response_model=RegistrationStatusResponse)
async def registration_status(
    settings: Annotated[Settings, Depends(get_settings)],
) -> RegistrationStatusResponse:
    """État d'ouverture des inscriptions, lu par le frontend.

    Remplace `NEXT_PUBLIC_REGISTRATION_ENABLED`, figée à la compilation et donc
    incapable de suivre un changement de mode : le WEB déclarait un état que le
    backend pouvait contredire. Ici le backend répond, et reste seul autoritaire —
    cette route ne fait qu'annoncer ce que `/register` appliquera de toute façon.

    Non limitée en débit : elle est consultée à chaque affichage du formulaire,
    ne touche ni la base ni Redis, et n'expose rien qu'une tentative d'inscription
    ne révélerait déjà.
    """
    policy = resolve_registration_policy(settings)
    return RegistrationStatusResponse(
        open=policy.open,
        mode=policy.mode.value,
        turnstile_required=policy.turnstile_required,
        # Publique par conception : c'est elle qui monte le widget. Le secret,
        # lui, ne quitte jamais le backend.
        turnstile_site_key=settings.turnstile_site_key or None,
        closes_at=policy.closes_at,
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    # Deux issues possibles, distinguees par le CODE HTTP : 201 = session ouverte,
    # 202 = compte cree, session differee jusqu'a la confirmation de l'adresse.
    # `response_model=None` laisse FastAPI serialiser le modele effectivement
    # retourne ; les deux schemas restent documentes via `responses`.
    response_model=None,
    responses={
        status.HTTP_201_CREATED: {"model": AuthTokenResponse},
        status.HTTP_202_ACCEPTED: {"model": RegistrationPendingResponse},
    },
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mobile: Annotated[bool, Depends(is_mobile_client)],
) -> AuthTokenResponse | RegistrationPendingResponse:
    policy = resolve_registration_policy(settings)

    # Barriere AVANT toute autre chose : avant la limite de debit (une inscription
    # fermee ne doit pas consommer le quota ni dependre de Redis) et avant le
    # moindre acces base. Aucun utilisateur, aucun profil, aucun email.
    if not policy.open:
        raise AppError(
            status_code=403,
            code="REGISTRATION_CLOSED",
            detail=(
                "Les inscriptions à la bêta Yunicity sont temporairement fermées. "
                "Vous possédez déjà un compte ? Connectez-vous."
            ),
        )

    ip = _client_ip(request)
    email = normalize_email(str(payload.email))

    # Trois axes, du plus specifique au plus large. L'adresse d'abord : c'est la
    # dimension qui distingue une personne d'une salle entiere, la ou l'IP les
    # confond. L'IP ensuite, avec un plafond assez haut pour qu'une classe
    # derriere un seul NAT passe sans encombre. Le plafond global enfin, seul
    # garde-fou contre un robot reparti sur de nombreuses adresses.
    await enforce_rate_limit(
        f"rl:register:email:{rate_limit_identity(email)}",
        limit=settings.registration_email_daily_limit,
        window_seconds=86400,
    )
    await enforce_rate_limit(
        f"rl:register:ip-burst:{ip}",
        limit=policy.ip_burst_limit,
        window_seconds=60,
    )
    await enforce_rate_limit(
        f"rl:register:ip:{ip}",
        limit=policy.ip_hourly_limit,
        window_seconds=3600,
    )
    await enforce_rate_limit(
        "rl:register:global",
        limit=policy.global_hourly_limit,
        window_seconds=3600,
    )

    await _require_turnstile(payload, request, settings=settings, policy=policy)

    service = AuthService(session, settings)
    result = await service.register(payload)

    if result.session is None:
        # Aucun cookie, aucun jeton : le compte existe mais la session attend la
        # confirmation de l'adresse.
        response.status_code = status.HTTP_202_ACCEPTED
        return RegistrationPendingResponse(
            message=(
                "Compte créé. Confirmez votre adresse e-mail pour accéder à Yunicity : "
                "un lien vous a été envoyé."
            ),
            user=result.user,
        )

    bundle = result.session
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


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ForgotPasswordResponse:
    ip = _client_ip(request)
    email = normalize_email(str(payload.email))
    await enforce_rate_limit(f"rl:forgot-password:ip:{ip}", limit=5, window_seconds=3600)
    await enforce_rate_limit(f"rl:forgot-password:email:{email}", limit=3, window_seconds=3600)

    service = PasswordResetService(session, settings)
    result = await service.request_password_reset(email)
    return ForgotPasswordResponse(message=result.message)


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ResetPasswordResponse:
    ip = _client_ip(request)
    await enforce_rate_limit(f"rl:reset-password:ip:{ip}", limit=10, window_seconds=3600)

    service = PasswordResetService(session, settings)
    message = await service.reset_password(payload.token, payload.new_password)
    return ResetPasswordResponse(message=message)


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VerifyEmailResponse:
    # Limite par IP uniquement : le jeton est le seul identifiant fourni, il n'y a
    # pas d'adresse a limiter. 20/h laisse place aux rechargements de page et aux
    # pre-chargements de lien des clients de messagerie, tout en fermant le
    # parcours d'un attaquant qui voudrait balayer l'espace des jetons.
    await enforce_rate_limit(
        f"rl:verify-email:ip:{_client_ip(request)}", limit=20, window_seconds=3600
    )

    service = EmailVerificationService(session, settings)
    message = await service.verify(payload.token)
    return VerifyEmailResponse(message=message)


@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    payload: ResendVerificationRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ResendVerificationResponse:
    ip = _client_ip(request)
    email = normalize_email(str(payload.email))
    await enforce_rate_limit(f"rl:resend-verification:ip:{ip}", limit=5, window_seconds=3600)
    await enforce_rate_limit(f"rl:resend-verification:email:{email}", limit=3, window_seconds=3600)

    service = EmailVerificationService(session, settings)
    result = await service.resend(email)
    return ResendVerificationResponse(message=result.message)
