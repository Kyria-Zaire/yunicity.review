"""Auth HTTP routes — thin layer over AuthService."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import is_mobile_client, require_authenticated_user
from app.core.errors import AppError
from app.core.rate_limit import (
    RATE_LIMIT_BACKEND_UNAVAILABLE,
    enforce_rate_limit,
    rate_limit_identity,
    release_slot,
    reserve_slot,
)
from app.core.registration_mode import (
    RegistrationPolicy,
    registration_config_problems,
    resolve_registration_policy,
)
from app.core.security import normalize_email, validate_password_strength
from app.db.session import get_db
from app.integrations.turnstile import TurnstileUnavailable, verify_turnstile_token
from app.models.user import User
from app.schemas.auth import (
    AccountDeletionRequest,
    AccountDeletionResponse,
    AccountDeletionStatusResponse,
    AuthTokenResponse,
    CancelAccountDeletionRequest,
    CancelAccountDeletionResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegistrationPendingResponse,
    RegistrationStatusResponse,
    ResendCancellationRequest,
    ResendCancellationResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.schemas.user import UserPublic
from app.services.account_deletion_service import (
    GENERIC_RESEND_CANCELLATION_MESSAGE,
    AccountDeletionService,
)
from app.services.auth_service import AuthService, IssuedRefreshToken
from app.services.email_verification_service import (
    GENERIC_RESEND_MESSAGE,
    EmailVerificationService,
)
from app.services.password_reset_service import (
    GENERIC_FORGOT_MESSAGE,
    PasswordResetService,
)

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


_GLOBAL_REGISTRATION_KEY = "rl:register:global"


def _ensure_registration_is_configured(settings: Settings, policy: RegistrationPolicy) -> None:
    """Refuse d'ouvrir si une protection indispensable manque (mode PUBLIC).

    Seuls des noms de variables sont journalisés, jamais leur valeur. Le message
    rendu ne les cite pas : la configuration du serveur ne regarde pas l'appelant.
    """
    manquants = registration_config_problems(settings, policy)
    if not manquants:
        return
    logger.error("registration_misconfigured missing=%s", ",".join(manquants))
    raise AppError(
        status_code=503,
        code="REGISTRATION_TEMPORARILY_UNAVAILABLE",
        detail=(
            "Les inscriptions sont momentanément indisponibles. Réessayez dans quelques instants."
        ),
    )


@asynccontextmanager
async def _registration_backend_guard() -> AsyncIterator[None]:
    """Traduit une panne du limiteur en refus d'inscription explicite.

    Le limiteur échoue déjà fermé ; on ne change donc pas la décision, seulement
    le code rendu, pour que « je ne peux pas compter » ne se confonde pas avec
    « tu as trop essayé ». Aucun compte n'est créé, aucun e-mail n'est tenté.
    """
    try:
        yield
    except AppError as erreur:
        if erreur.code != RATE_LIMIT_BACKEND_UNAVAILABLE:
            raise
        logger.error("registration_refused_backend_unavailable")
        raise AppError(
            status_code=503,
            code="REGISTRATION_TEMPORARILY_UNAVAILABLE",
            detail=(
                "Les inscriptions sont momentanément indisponibles. "
                "Réessayez dans quelques instants."
            ),
        ) from None


async def _reserve_global_slot(policy: RegistrationPolicy) -> None:
    """Réserve une place sous le plafond global, atomiquement.

    Verification, increment et pose du TTL sont un seul script : deux requetes
    simultanees ne peuvent plus lire la meme valeur avant d'incrementer toutes
    les deux. La place est prise AVANT la creation et rendue si celle-ci echoue,
    de sorte que le compteur reflete les inscriptions reellement creees sans
    jamais laisser le plafond etre depasse.
    """
    if await reserve_slot(_GLOBAL_REGISTRATION_KEY, policy.global_hourly_limit, 3600):
        return
    logger.warning("global_registration_cap_reached limit=%s", policy.global_hourly_limit)
    raise AppError(
        status_code=429,
        code="RATE_LIMITED",
        detail="Trop de tentatives. Réessayez plus tard.",
    )


async def _release_global_slot() -> None:
    """Rend la place quand la création échoue après réservation."""
    await release_slot(_GLOBAL_REGISTRATION_KEY)


async def _limits_available(
    *limites: tuple[str, int, int],
    event: str,
) -> bool:
    """Applique des limites, en distinguant « dépassé » de « incomptable ».

    Un dépassement se propage normalement en 429. Une panne du limiteur rend
    False : l'appelant répond alors sa phrase générique habituelle sans rien
    envoyer. C'est le seul moyen de tenir les deux exigences à la fois — ne pas
    envoyer sans garantie, et ne pas laisser la réponse varier selon l'état du
    service, ce qui redonnerait un signal exploitable.
    """
    try:
        for cle, plafond, fenetre in limites:
            await enforce_rate_limit(cle, limit=plafond, window_seconds=fenetre)
    except AppError as erreur:
        if erreur.code != RATE_LIMIT_BACKEND_UNAVAILABLE:
            raise
        # Alerte d'exploitation : un nom d'evenement, jamais une adresse.
        logger.error("%s_suppressed_backend_unavailable", event)
        return False
    return True


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
    # Une protection indispensable manquante rend l'ouverture inoperante : on
    # l'annonce plutot que de laisser afficher un formulaire qui echouera.
    indisponible = bool(registration_config_problems(settings, policy))
    return RegistrationStatusResponse(
        open=policy.open and not indisponible,
        mode=policy.mode.value,
        turnstile_required=policy.turnstile_required,
        # Publique par conception : c'est elle qui monte le widget. Le secret,
        # lui, ne quitte jamais le backend.
        turnstile_site_key=settings.turnstile_site_key or None,
        closes_at=policy.closes_at,
        temporarily_unavailable=indisponible,
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

    # En PUBLIC, une protection indispensable manquante interdit d'ouvrir. Ne
    # jamais transformer l'absence d'une cle en desactivation silencieuse.
    _ensure_registration_is_configured(settings, policy)

    ip = _client_ip(request)
    email = normalize_email(str(payload.email))

    async with _registration_backend_guard():
        # L'IP d'abord, mais avec des plafonds qui ne visent qu'une machine :
        # cent personnes d'une meme salle soumettent dans la meme minute derriere
        # une seule adresse publique. La protection reelle est ailleurs — plafond
        # global et Turnstile.
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

        # Les validations LOCALES passent avant le compteur par adresse : une
        # faute de frappe dans le mot de passe ne doit pas consommer un quota
        # journalier. Le compteur ne s'incremente donc qu'une fois la demande
        # formellement recevable. `AuthService.register` revalidera — la
        # fonction est pure, et la route ne doit pas devenir la seule gardienne.
        validate_password_strength(payload.password)

        await enforce_rate_limit(
            f"rl:register:email:{rate_limit_identity(email)}",
            limit=settings.registration_email_daily_limit,
            window_seconds=86400,
        )

    await _require_turnstile(payload, request, settings=settings, policy=policy)

    # La place est prise avant la creation, et rendue si celle-ci echoue : le
    # compteur ne comptabilise que des comptes reellement crees, sans qu'une
    # course puisse faire depasser le plafond.
    async with _registration_backend_guard():
        await _reserve_global_slot(policy)

    try:
        service = AuthService(session, settings)
        result = await service.register(payload)
    except Exception:
        # Une seule compensation par requete : le chemin nominal ne passe jamais
        # ici, et le script Redis refuse de descendre sous zero de toute facon.
        await _release_global_slot()
        raise

    if result.session is None:
        # Aucun cookie, aucun jeton : le compte existe mais la session attend la
        # confirmation de l'adresse.
        response.status_code = status.HTTP_202_ACCEPTED
        # Le message dit ce qui s'est REELLEMENT passe. Aucune file de reprise
        # n'existe : annoncer un envoi qui n'a pas eu lieu laisserait quelqu'un
        # attendre un e-mail qui ne viendra jamais.
        return RegistrationPendingResponse(
            message=(
                "Compte créé. Confirmez votre adresse e-mail pour accéder à Yunicity : "
                "un lien vous a été envoyé."
                if result.verification_email_sent
                else "Compte créé. L'envoi de l'e-mail de confirmation est momentanément "
                "indisponible : demandez un nouveau lien dans quelques minutes."
            ),
            user=result.user,
            verification_email_sent=result.verification_email_sent,
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

    if not await _limits_available(
        (f"rl:forgot-password:ip:{ip}", 5, 3600),
        (f"rl:forgot-password:email:{rate_limit_identity(email)}", 3, 3600),
        event="forgot_password",
    ):
        # Redis injoignable : on ne peut garantir ni la limite ni le budget, donc
        # on n'envoie rien. La reponse reste STRICTEMENT celle du cas nominal —
        # un 503 ici distinguerait l'etat du service selon le moment et, surtout,
        # romprait l'uniformite sur laquelle repose l'anti-enumeration.
        return ForgotPasswordResponse(message=GENERIC_FORGOT_MESSAGE)

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

    if not await _limits_available(
        (f"rl:resend-verification:ip:{ip}", 5, 3600),
        (f"rl:resend-verification:email:{rate_limit_identity(email)}", 3, 3600),
        event="resend_verification",
    ):
        return ResendVerificationResponse(message=GENERIC_RESEND_MESSAGE)

    service = EmailVerificationService(session, settings)
    result = await service.resend(email)
    return ResendVerificationResponse(message=result.message)


@router.get("/account/deletion", response_model=AccountDeletionStatusResponse)
async def account_deletion_status(
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AccountDeletionStatusResponse:
    """État de la demande pour le compte courant.

    En pratique inatteignable tant qu'une demande est en cours, puisque l'accès
    est coupé : elle sert à l'interface AVANT la demande, et après une annulation.
    """
    service = AccountDeletionService(session, settings)
    service.ensure_feature_enabled()
    etat = service.status_of(current_user)
    return AccountDeletionStatusResponse(
        pending=etat.pending,
        requested_at=etat.requested_at,
        scheduled_for=etat.scheduled_for,
    )


@router.post("/account/deletion", response_model=AccountDeletionResponse)
async def request_account_deletion(
    payload: AccountDeletionRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AccountDeletionResponse:
    """Ouvre le délai de grâce. AUCUNE donnée n'est supprimée ici."""
    await enforce_rate_limit(
        f"rl:account-deletion:ip:{_client_ip(request)}", limit=5, window_seconds=3600
    )

    service = AccountDeletionService(session, settings)
    result = await service.request_deletion(current_user, payload.password)

    return AccountDeletionResponse(
        message=(
            "Votre compte sera supprimé à la date indiquée. "
            "Un e-mail contenant un lien d'annulation vient de vous être envoyé."
            if result.email_sent
            else "Votre compte sera supprimé à la date indiquée. L'envoi de l'e-mail "
            "d'annulation a échoué : demandez un nouveau lien depuis la page de "
            "connexion pour revenir sur cette décision."
        ),
        scheduled_for=result.scheduled_for,
        email_sent=result.email_sent,
    )


@router.post("/account/deletion/cancel", response_model=CancelAccountDeletionResponse)
async def cancel_account_deletion(
    payload: CancelAccountDeletionRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CancelAccountDeletionResponse:
    """Annule la demande. NON authentifiée : l'accès est justement coupé.

    Le jeton porte l'autorisation, comme pour une réinitialisation de mot de
    passe. La limite par IP protège contre le balayage de l'espace des jetons.
    """
    await enforce_rate_limit(
        f"rl:account-deletion-cancel:ip:{_client_ip(request)}", limit=20, window_seconds=3600
    )

    service = AccountDeletionService(session, settings)
    message = await service.cancel_deletion(payload.token)
    return CancelAccountDeletionResponse(message=message)


@router.post("/account/deletion/resend", response_model=ResendCancellationResponse)
async def resend_cancellation_link(
    payload: ResendCancellationRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ResendCancellationResponse:
    """Réémet le lien d'annulation. NON authentifiée : l'accès est justement coupé.

    Sans cette voie, une panne d'envoi au moment de la demande enfermait
    quelqu'un dehors sans recours. La réponse est générique et les limites
    portent sur une empreinte de l'adresse, jamais sur l'adresse elle-même.
    """
    ip = _client_ip(request)
    email = normalize_email(str(payload.email))

    if not await _limits_available(
        (f"rl:deletion-resend:ip:{ip}", 5, 3600),
        (f"rl:deletion-resend:email:{rate_limit_identity(email)}", 3, 3600),
        event="deletion_cancellation_resend",
    ):
        # Redis injoignable : on n'envoie rien, mais la reponse ne change pas.
        return ResendCancellationResponse(message=GENERIC_RESEND_CANCELLATION_MESSAGE)

    service = AccountDeletionService(session, settings)
    message = await service.resend_cancellation_link(email)
    return ResendCancellationResponse(message=message)
