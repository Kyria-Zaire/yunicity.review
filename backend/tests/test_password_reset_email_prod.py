"""Password reset email delivery tests in prod mode (QA-05B)."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock

import pytest
from app.core.config import Settings, get_settings
from app.db.session import get_session_factory
from app.integrations.resend_email import EmailDeliveryError
from app.services.password_reset_service import PasswordResetService
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_GENERIC_FORGOT_MESSAGE = (
    "Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
)


@pytest.fixture(autouse=True)
def disable_password_reset_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


@pytest.fixture
def password_reset_payload(register_payload: dict[str, str]) -> dict[str, str]:
    suffix = uuid.uuid4().hex[:10]
    return {**register_payload, "email": f"reset-prod-{suffix}@example.com"}


def _prod_settings() -> Settings:
    base = get_settings()
    return Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        DATABASE_URL=base.database_url,
        REDIS_URL=base.redis_url or "redis://localhost:6379/0",
        CORS_ORIGINS=["https://yunicity.fr"],
        WEB_FRONTEND_URL="https://yunicity.fr",
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.fr",
        EMAIL_PROVIDER="resend",
        RESEND_API_KEY="re_test_key",
        EMAIL_FROM="no-reply@yunicity.fr",
    )


async def _register(client: AsyncClient, payload: dict[str, str]) -> None:
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_request_password_reset_prod_sends_email(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    send_mock = AsyncMock(return_value=None)
    monkeypatch.setattr(
        "app.services.password_reset_service.send_password_reset_email",
        send_mock,
    )

    await _register(auth_client, password_reset_payload)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        service = PasswordResetService(session, _prod_settings())
        result = await service.request_password_reset(password_reset_payload["email"])

    assert result.message == _GENERIC_FORGOT_MESSAGE
    assert not hasattr(result, "reset_url"), "le lien ne doit plus exister dans le resultat"
    send_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_provider_outage_does_not_reveal_that_the_account_exists(
    auth_client: AsyncClient,
    password_reset_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Une panne du fournisseur ne doit pas devenir un oracle d'existence.

    L'envoi n'est tenté que pour un compte existant. Propager l'échec rendait
    donc 503 pour une adresse connue et 200 pour une inconnue : de quoi énumérer
    les comptes pendant une panne. La panne est journalisée, pas propagée.
    """

    async def _fail(*_args: object, **_kwargs: object) -> None:
        raise EmailDeliveryError("provider down")

    monkeypatch.setattr(
        "app.services.password_reset_service.send_password_reset_email",
        _fail,
    )

    await _register(auth_client, password_reset_payload)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        service = PasswordResetService(session, _prod_settings())
        connu = await service.request_password_reset(password_reset_payload["email"])

    async with factory() as session:
        service = PasswordResetService(session, _prod_settings())
        inconnu = await service.request_password_reset("absente-du-tout@example.com")

    assert connu.message == inconnu.message == _GENERIC_FORGOT_MESSAGE


@pytest.mark.asyncio
async def test_request_password_reset_unknown_email_prod_no_send(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    send_mock = AsyncMock(return_value=None)
    monkeypatch.setattr(
        "app.services.password_reset_service.send_password_reset_email",
        send_mock,
    )

    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        service = PasswordResetService(session, _prod_settings())
        result = await service.request_password_reset("unknown@example.com")

    assert result.message == _GENERIC_FORGOT_MESSAGE
    assert not hasattr(result, "reset_url")
    send_mock.assert_not_called()
