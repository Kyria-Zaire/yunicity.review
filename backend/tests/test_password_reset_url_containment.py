"""Confinement du lien de réinitialisation — AUTH-03.

Un lien de réinitialisation vaut un mot de passe à usage unique pendant une
heure. Trois chemins pouvaient le laisser échapper, et ce fichier ferme les
trois :

1. **La réponse HTTP** rendait `reset_url` dès que `APP_ENV != "prod"`.
2. **L'envoi** était conditionné à `APP_ENV == "prod"` : ailleurs, aucun e-mail
   ne partait, et la réponse HTTP était le seul moyen d'obtenir le lien.
3. **Les journaux** imprimaient le lien sans aucun garde-fou d'environnement dès
   que le fournisseur valait `console`.

La matrice ci-dessous couvre les environnements réellement déployables, pas
seulement `dev` et `prod`.
"""

from __future__ import annotations

import logging
from typing import Any

import pytest
from app.core.config import AppEnv, EmailProvider, Settings
from app.integrations.resend_email import (
    local_link_disclosure_allowed,
    send_email_verification_email,
    send_password_reset_email,
)
from app.schemas.auth import ForgotPasswordResponse
from app.services.password_reset_service import ForgotPasswordResult
from httpx import AsyncClient

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"
_STRONG_JWT = "tests-auth03-secret-suffisamment-long-et-non-liste-48c"
_LINK = "https://exemple.test/login/reset-password?token=jeton-secret-a-ne-pas-fuir"

_GENERIC = "Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."


def _settings(app_env: AppEnv, provider: EmailProvider) -> Settings:
    """Réglages valides pour l'environnement demandé.

    `preprod` et `prod` imposent un secret fort et un pepper ; les renseigner
    plutôt que rabattre le test sur `dev` est ce qui rend la matrice honnête.
    """
    if app_env in ("preprod", "prod"):
        return Settings(
            APP_ENV=app_env,
            EMAIL_PROVIDER=provider,
            JWT_SECRET_KEY=_STRONG_JWT,
            REFRESH_TOKEN_PEPPER="tests-auth03-pepper-refresh-non-vide",
            REFRESH_COOKIE_SECURE=True,
            DATABASE_URL="postgresql+asyncpg://u:p@db.internal:5432/x",
            REDIS_URL="redis://redis.internal:6379/0",
            CORS_ORIGINS=["https://exemple.test"],
            WEB_FRONTEND_URL="https://exemple.test",
            MEDIA_PUBLIC_BASE_URL="https://api.exemple.test",
            RESEND_API_KEY="re_test_key" if provider == "resend" else None,
            EMAIL_FROM="no-reply@exemple.test" if provider == "resend" else None,
        )
    return Settings(APP_ENV=app_env, EMAIL_PROVIDER=provider, JWT_SECRET_KEY=_JWT)


# --------------------------------------------------------------- contrat HTTP


def test_the_http_schema_cannot_carry_the_link_at_all() -> None:
    """Le champ est retiré du schéma, pas seulement laissé vide.

    Un champ optionnel qui ne se remplit que hors production est précisément ce
    qu'un déploiement `recette` réactive sans que personne le remarque.
    """
    assert "reset_url" not in ForgotPasswordResponse.model_fields
    assert set(ForgotPasswordResponse.model_fields) == {"message"}

    rendu = ForgotPasswordResponse(message=_GENERIC).model_dump()
    assert rendu == {"message": _GENERIC}


def test_the_service_result_cannot_carry_the_link_either() -> None:
    resultat = ForgotPasswordResult(message=_GENERIC)
    assert not hasattr(resultat, "reset_url")
    assert [champ for champ in resultat.__dataclass_fields__] == ["message"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_endpoint_answers_the_same_for_known_and_unknown_addresses(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.services.password_reset_service.send_password_reset_email", _noop)

    connue = {**register_payload, "email": "auth03-connue@example.com"}
    assert (await auth_client.post("/api/v1/auth/register", json=connue)).status_code == 201

    a = await auth_client.post("/api/v1/auth/forgot-password", json={"email": connue["email"]})
    b = await auth_client.post(
        "/api/v1/auth/forgot-password", json={"email": "auth03-inconnue@example.com"}
    )

    # Même statut, même structure, même message : rien ne distingue les deux cas.
    assert a.status_code == b.status_code == 200
    assert a.json() == b.json()
    assert set(a.json()) == {"message"}
    assert "token" not in a.text.lower()


# ------------------------------------------------------ garde-fou de divulgation


@pytest.mark.parametrize(
    ("app_env", "provider", "railway", "attendu"),
    [
        # Le seul cas autorisé : poste de développement local.
        ("dev", "console", None, True),
        # Railway injecte RAILWAY_ENVIRONMENT dans tout conteneur qu'il exécute.
        ("dev", "console", "production", False),
        ("dev", "console", "preview", False),
        # Environnements déployables déclarant autre chose que dev.
        ("recette", "console", None, False),
        ("preprod", "console", None, False),
        ("prod", "console", None, False),
        # Avec un vrai fournisseur, le journal n'a aucune raison de doubler le lien.
        ("dev", "resend", None, False),
        ("prod", "resend", None, False),
        ("dev", "none", None, False),
    ],
)
def test_disclosure_guard_is_fail_closed(
    app_env: AppEnv,
    provider: EmailProvider,
    railway: str | None,
    attendu: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    if railway is None:
        monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    else:
        monkeypatch.setenv("RAILWAY_ENVIRONMENT", railway)

    assert local_link_disclosure_allowed(_settings(app_env, provider)) is attendu


# ----------------------------------------------------------------- les journaux


@pytest.mark.parametrize("app_env", ["recette", "preprod", "prod"])
@pytest.mark.asyncio
async def test_deployed_environments_never_log_the_link(
    app_env: AppEnv,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    caplog.set_level(logging.DEBUG)

    await send_password_reset_email(
        to="citoyen@example.com", reset_url=_LINK, settings=_settings(app_env, "console")
    )

    trace = caplog.text + repr([r.__dict__ for r in caplog.records])
    assert "jeton-secret-a-ne-pas-fuir" not in trace
    assert _LINK not in trace
    assert "citoyen@example.com" not in trace, "l'adresse doit rester masquée"


@pytest.mark.asyncio
async def test_railway_presence_alone_closes_the_disclosure(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Même en APP_ENV=dev, un conteneur Railway ne doit rien imprimer."""
    monkeypatch.setenv("RAILWAY_ENVIRONMENT", "preview")
    caplog.set_level(logging.DEBUG)

    await send_password_reset_email(
        to="citoyen@example.com", reset_url=_LINK, settings=_settings("dev", "console")
    )

    assert "jeton-secret-a-ne-pas-fuir" not in (
        caplog.text + repr([r.__dict__ for r in caplog.records])
    )


@pytest.mark.asyncio
async def test_local_development_still_prints_the_link(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Le confort du poste local est conservé : c'est le seul endroit permis."""
    monkeypatch.delenv("RAILWAY_ENVIRONMENT", raising=False)
    caplog.set_level(logging.DEBUG)

    await send_password_reset_email(
        to="citoyen@example.com", reset_url=_LINK, settings=_settings("dev", "console")
    )

    assert _LINK in repr([r.__dict__ for r in caplog.records])


@pytest.mark.asyncio
async def test_the_verification_sender_obeys_the_same_guard(
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """AUTH-01 ne doit pas rester plus permissif qu'AUTH-03."""
    monkeypatch.setenv("RAILWAY_ENVIRONMENT", "production")
    caplog.set_level(logging.DEBUG)

    await send_email_verification_email(
        to="citoyen@example.com",
        verification_url="https://exemple.test/login/verify-email?token=jeton-verif-secret",
        settings=_settings("dev", "console"),
    )

    assert "jeton-verif-secret" not in (caplog.text + repr([r.__dict__ for r in caplog.records]))


# ------------------------------------------------------------ envoi observable


@pytest.mark.parametrize("app_env", ["dev", "recette", "preprod", "prod"])
@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_email_is_attempted_in_every_environment(
    app_env: AppEnv,
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Conditionner l'envoi à `prod` privait recette et preprod de tout e-mail."""
    from app.db.session import get_session_factory
    from app.services.password_reset_service import PasswordResetService

    envoyes: list[dict[str, Any]] = []

    async def _capture(*, to: str, reset_url: str, settings: object) -> None:
        envoyes.append({"to": to, "url": reset_url})

    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)
    monkeypatch.setattr("app.services.password_reset_service.send_password_reset_email", _capture)

    payload = {**register_payload, "email": f"auth03-{app_env}@example.com"}
    assert (await auth_client.post("/api/v1/auth/register", json=payload)).status_code == 201

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        service = PasswordResetService(session, _settings(app_env, "console"))
        result = await service.request_password_reset(payload["email"])

    assert result.message == _GENERIC
    assert len(envoyes) == 1, f"aucun e-mail tenté en APP_ENV={app_env}"
    assert "token=" in envoyes[0]["url"]
