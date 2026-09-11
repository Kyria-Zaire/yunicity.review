"""Émetteur d'e-mail de vérification — tests unitaires (AUTH-01).

Ce fichier verrouille surtout une propriété de sécurité : le lien de
confirmation vaut un mot de passe à usage unique pendant 24 heures. Il ne doit
apparaître dans aucun journal en dehors du poste de développement.
"""

from __future__ import annotations

import logging
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from app.core.config import Settings
from app.integrations.resend_email import (
    EmailDeliveryError,
    build_email_verification_html,
    send_email_verification_email,
)

_VERIFICATION_URL = "https://yunicity.city/login/verify-email?token=jeton-secret-123"
_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"
#: APP_ENV=prod applique une exigence de robustesse sur le secret : la valeur de
#: developpement est refusee, a juste titre. Ce secret de test n'ouvre rien.
_STRONG_JWT = "tests-auth01-secret-suffisamment-long-et-non-liste-48c"


def _resend_settings() -> Settings:
    return Settings(
        EMAIL_PROVIDER="resend",
        RESEND_API_KEY="re_test_key",
        EMAIL_FROM="no-reply@yunicity.city",
        JWT_SECRET_KEY=_JWT,
    )


def _dev_console_settings() -> Settings:
    return Settings(EMAIL_PROVIDER="console", APP_ENV="dev", JWT_SECRET_KEY=_JWT)


def _prod_console_settings() -> Settings:
    """Reproduit la configuration reelle de Preview : APP_ENV=prod, provider console.

    `validate_environment_rules` impose tout ce bloc en prod ; le renseigner
    entierement plutot que de rabattre le test sur un environnement plus permissif,
    c'est eprouver la situation qui existe vraiment sur Preview.
    """
    return Settings(
        APP_ENV="prod",
        DEBUG=False,
        EMAIL_PROVIDER="console",
        JWT_SECRET_KEY=_STRONG_JWT,
        REFRESH_TOKEN_PEPPER="tests-auth01-pepper-refresh-non-vide",
        REFRESH_COOKIE_SECURE=True,
        DATABASE_URL="postgresql+asyncpg://u:p@db.internal:5432/yunicity_preview",
        REDIS_URL="redis://redis.internal:6379/0",
        CORS_ORIGINS=["https://preview.yunicity.city"],
        WEB_FRONTEND_URL="https://preview.yunicity.city",
        MEDIA_PUBLIC_BASE_URL="https://api-preview.yunicity.city",
    )


@pytest.mark.asyncio
async def test_console_provider_never_logs_the_link_outside_local_dev(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Preview declare APP_ENV=prod : le jeton ne doit pas fuiter dans ses journaux."""
    caplog.set_level(logging.DEBUG)

    await send_email_verification_email(
        to="citoyen@example.com",
        verification_url=_VERIFICATION_URL,
        settings=_prod_console_settings(),
    )

    trace = caplog.text + repr([record.__dict__ for record in caplog.records])
    assert "jeton-secret-123" not in trace
    assert _VERIFICATION_URL not in trace
    # L'adresse elle-meme reste masquee.
    assert "citoyen@example.com" not in trace


@pytest.mark.asyncio
async def test_console_provider_prints_the_link_in_local_dev(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """En dev local, le lien est imprime pour derouler le parcours a la main."""
    caplog.set_level(logging.DEBUG)

    await send_email_verification_email(
        to="citoyen@example.com",
        verification_url=_VERIFICATION_URL,
        settings=_dev_console_settings(),
    )

    logged = repr([record.__dict__ for record in caplog.records])
    assert _VERIFICATION_URL in logged


@pytest.mark.asyncio
async def test_resend_provider_sends_the_expected_payload() -> None:
    response = httpx.Response(200, json={"id": "email_123"})

    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.__aexit__.return_value = None
        client.post = AsyncMock(return_value=response)
        client_cls.return_value = client

        await send_email_verification_email(
            to="citoyen@example.com",
            verification_url=_VERIFICATION_URL,
            settings=_resend_settings(),
        )

    payload = client.post.await_args.kwargs["json"]
    assert payload["to"] == ["citoyen@example.com"]
    assert "Confirmez" in payload["subject"]
    assert _VERIFICATION_URL in payload["html"]


@pytest.mark.asyncio
async def test_provider_error_raises_email_delivery_error() -> None:
    response = httpx.Response(422, json={"message": "invalid from"})

    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.__aexit__.return_value = None
        client.post = AsyncMock(return_value=response)
        client_cls.return_value = client

        with pytest.raises(EmailDeliveryError):
            await send_email_verification_email(
                to="citoyen@example.com",
                verification_url=_VERIFICATION_URL,
                settings=_resend_settings(),
            )


@pytest.mark.asyncio
async def test_transport_error_raises_email_delivery_error() -> None:
    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.__aexit__.return_value = None
        client.post = AsyncMock(side_effect=httpx.ConnectError("boom"))
        client_cls.return_value = client

        with pytest.raises(EmailDeliveryError):
            await send_email_verification_email(
                to="citoyen@example.com",
                verification_url=_VERIFICATION_URL,
                settings=_resend_settings(),
            )


@pytest.mark.asyncio
async def test_missing_configuration_raises_rather_than_silently_dropping() -> None:
    settings = Settings(EMAIL_PROVIDER="resend", RESEND_API_KEY="", JWT_SECRET_KEY=_JWT)

    with pytest.raises(EmailDeliveryError):
        await send_email_verification_email(
            to="citoyen@example.com",
            verification_url=_VERIFICATION_URL,
            settings=settings,
        )


def test_email_body_carries_the_link_and_no_remote_asset() -> None:
    html = build_email_verification_html(_VERIFICATION_URL)

    assert _VERIFICATION_URL in html
    assert "expire dans 24 heures" in html, "la duree de validite doit etre annoncee"
    # Aucune ressource distante : pas de pixel de suivi, pas de fuite d'ouverture.
    assert "<img" not in html.lower()
    assert "http://" not in html.replace("http://www.w3.org", "")


def test_email_body_announces_the_configured_expiry_not_a_hardcoded_one() -> None:
    """Changer EMAIL_VERIFICATION_EXPIRE_HOURS ne doit pas rendre l'e-mail menteur."""
    assert "expire dans 48 heures" in build_email_verification_html(_VERIFICATION_URL, 48)
