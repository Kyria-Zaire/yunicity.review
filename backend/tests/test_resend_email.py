"""Resend email integration unit tests (QA-05B)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import httpx
import pytest
from app.core.config import Settings
from app.integrations.resend_email import (
    EmailDeliveryError,
    build_password_reset_email_html,
    send_password_reset_email,
)


def _resend_settings() -> Settings:
    return Settings(
        EMAIL_PROVIDER="resend",
        RESEND_API_KEY="re_test_key",
        EMAIL_FROM="no-reply@yunicity.fr",
        JWT_SECRET_KEY="dev-only-insecure-jwt-secret-change-in-env-32chars",
    )


@pytest.mark.asyncio
async def test_send_password_reset_email_success() -> None:
    settings = _resend_settings()
    response = httpx.Response(200, json={"id": "email_123"})

    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.__aexit__.return_value = None
        client.post = AsyncMock(return_value=response)
        client_cls.return_value = client

        await send_password_reset_email(
            to="user@example.com",
            reset_url="https://yunicity.fr/login/reset-password?token=abc",
            settings=settings,
        )

    client.post.assert_awaited_once()
    call_kwargs = client.post.await_args.kwargs
    assert call_kwargs["json"]["to"] == ["user@example.com"]
    assert "Réinitialisation" in call_kwargs["json"]["subject"]


@pytest.mark.asyncio
async def test_send_password_reset_email_provider_error() -> None:
    settings = _resend_settings()
    response = httpx.Response(422, json={"message": "invalid from"})

    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        client = AsyncMock()
        client.__aenter__.return_value = client
        client.__aexit__.return_value = None
        client.post = AsyncMock(return_value=response)
        client_cls.return_value = client

        with pytest.raises(EmailDeliveryError):
            await send_password_reset_email(
                to="user@example.com",
                reset_url="https://yunicity.fr/login/reset-password?token=abc",
                settings=settings,
            )


@pytest.mark.asyncio
async def test_send_password_reset_email_skipped_when_provider_none() -> None:
    settings = Settings(
        EMAIL_PROVIDER="none",
        JWT_SECRET_KEY="dev-only-insecure-jwt-secret-change-in-env-32chars",
    )

    with patch("app.integrations.resend_email.httpx.AsyncClient") as client_cls:
        await send_password_reset_email(
            to="user@example.com",
            reset_url="https://yunicity.fr/login/reset-password?token=abc",
            settings=settings,
        )
        client_cls.assert_not_called()


def test_build_password_reset_email_html_contains_link() -> None:
    html = build_password_reset_email_html("https://yunicity.fr/login/reset-password?token=abc")
    assert "https://yunicity.fr/login/reset-password?token=abc" in html
    assert "Réinitialiser mon mot de passe" in html
