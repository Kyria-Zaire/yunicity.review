"""Vérification d'adresse e-mail — tests d'intégration (AUTH-01).

Deux garanties structurent ce fichier et doivent rester vraies :

- **Sans `EMAIL_VERIFICATION_ENFORCED_FROM`, rien ne change.** C'est la protection
  des comptes déjà ouverts : un oubli de configuration ne peut bloquer personne.
- **Un compte créé AVANT la date d'application n'est jamais bloqué**, même non
  vérifié, même une fois l'exigence activée.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from app.core.config import get_settings
from app.db.session import get_engine
from app.models.email_verification_token import EmailVerificationToken
from app.models.user import User
from app.services.email_verification_service import (
    GENERIC_RESEND_MESSAGE,
    hash_verification_token,
)
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

#: Date passée : tout compte créé pendant le test est soumis à l'exigence.
_ENFORCED_SINCE_PAST = "2020-01-01T00:00:00+00:00"
#: Date future : tout compte créé pendant le test est « historique », donc exempt.
_ENFORCED_FROM_FUTURE = "2099-01-01T00:00:00+00:00"

_PEPPER = "pepper-de-test-verification-email"


@pytest.fixture(autouse=True)
def disable_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


@pytest.fixture
def sent_links(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Intercepte les liens émis.

    L'API ne renvoie JAMAIS le lien dans sa réponse — contrairement au parcours
    de réinitialisation, qui l'expose hors production. Les tests le récupèrent
    donc à la source plutôt que d'affaiblir le contrat pour se faciliter la vie.
    """
    links: list[str] = []

    async def _capture(*, to: str, verification_url: str, settings: object) -> None:
        links.append(verification_url)

    monkeypatch.setattr(
        "app.services.email_verification_service.send_email_verification_email",
        _capture,
    )
    return links


@pytest.fixture
def pepper_env(auth_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("EMAIL_VERIFICATION_TOKEN_PEPPER", _PEPPER)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def enforced(pepper_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Exigence ACTIVE pour les comptes créés pendant le test."""
    monkeypatch.setenv("EMAIL_VERIFICATION_ENFORCED_FROM", _ENFORCED_SINCE_PAST)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def enforced_later(pepper_env: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Exigence configurée, mais postérieure : les comptes du test sont historiques."""
    monkeypatch.setenv("EMAIL_VERIFICATION_ENFORCED_FROM", _ENFORCED_FROM_FUTURE)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def verify_payload(register_payload: dict[str, str]) -> dict[str, str]:
    return {**register_payload, "email": f"verify-{uuid.uuid4().hex[:10]}@example.com"}


def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def _token_from(link: str) -> str:
    token = parse_qs(urlparse(link).query).get("token", [None])[0]
    assert token
    return token


async def _register(client: AsyncClient, payload: dict[str, str], *, expected: int) -> Any:
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == expected, response.text
    return response.json()


async def _verify(client: AsyncClient, token: str) -> Any:
    return await client.post("/api/v1/auth/verify-email", json={"token": token})


async def _login(client: AsyncClient, payload: dict[str, str]) -> Any:
    return await client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )


async def _load_user(email: str) -> User:
    async with _session_factory()() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one()


# --------------------------------------------------------------------- non-régression


async def test_register_keeps_201_and_session_when_enforcement_is_disabled(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    """Sans date configurée, l'inscription se comporte exactement comme avant."""
    data = await _register(auth_client, verify_payload, expected=201)

    assert data["access_token"]
    assert data["user"]["is_verified"] is False
    # Le lien est tout de même envoyé : l'utilisateur peut confirmer volontairement.
    assert len(sent_links) == 1


async def test_login_succeeds_unverified_when_enforcement_is_disabled(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    response = await _login(auth_client, verify_payload)
    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_account_created_before_the_enforcement_date_is_never_blocked(
    enforced_later: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    """Le cas des comptes déjà ouverts : exigence active, mais postérieure à eux."""
    data = await _register(auth_client, verify_payload, expected=201)
    assert data["access_token"]

    response = await _login(auth_client, verify_payload)
    assert response.status_code == 200, "un compte historique non vérifié doit rester accessible"

    user = await _load_user(verify_payload["email"])
    assert user.is_verified is False, "son état ne doit pas être modifié artificiellement"


# --------------------------------------------------------------------- application


async def test_register_returns_202_without_session_when_enforced(
    enforced: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    response = await auth_client.post("/api/v1/auth/register", json=verify_payload)

    assert response.status_code == 202
    body = response.json()
    assert body["verification_required"] is True
    assert "access_token" not in body
    assert "refresh_token" not in body
    settings = get_settings()
    assert settings.refresh_cookie_name not in response.cookies, "aucune session ne doit s'ouvrir"
    assert len(sent_links) == 1


async def test_login_is_refused_with_email_not_verified_when_enforced(
    enforced: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=202)

    response = await _login(auth_client, verify_payload)
    assert response.status_code == 403
    assert response.json()["code"] == "EMAIL_NOT_VERIFIED"


async def test_login_succeeds_once_the_address_is_verified(
    enforced: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=202)

    verified = await _verify(auth_client, _token_from(sent_links[0]))
    assert verified.status_code == 200

    response = await _login(auth_client, verify_payload)
    assert response.status_code == 200
    assert response.json()["user"]["is_verified"] is True


# --------------------------------------------------------------------- consommation


async def test_verify_email_marks_the_account_verified(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)

    response = await _verify(auth_client, _token_from(sent_links[0]))
    assert response.status_code == 200

    user = await _load_user(verify_payload["email"])
    assert user.is_verified is True


async def test_verify_email_rejects_an_unknown_token(
    pepper_env: None,
    auth_client: AsyncClient,
) -> None:
    response = await _verify(auth_client, f"jeton-inexistant-{uuid.uuid4().hex}")
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_VERIFICATION_TOKEN"


async def test_verify_email_rejects_a_replayed_token(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    token = _token_from(sent_links[0])

    assert (await _verify(auth_client, token)).status_code == 200

    replay = await _verify(auth_client, token)
    assert replay.status_code == 400
    assert replay.json()["code"] == "VERIFICATION_TOKEN_ALREADY_USED"


async def test_verify_email_rejects_an_expired_token(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    token = _token_from(sent_links[0])
    token_hash = hash_verification_token(token, get_settings().email_verification_token_pepper)

    async with _session_factory()() as session:
        result = await session.execute(
            select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
        )
        stored = result.scalar_one()
        stored.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        session.add(stored)
        await session.commit()

    response = await _verify(auth_client, token)
    assert response.status_code == 400
    assert response.json()["code"] == "VERIFICATION_TOKEN_EXPIRED"

    user = await _load_user(verify_payload["email"])
    assert user.is_verified is False


async def test_concurrent_verifications_consume_the_token_exactly_once(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    """Deux requêtes simultanées : une seule peut réussir.

    C'est la raison d'être de l'UPDATE conditionnel du dépôt. Un
    lire-puis-écrire laisserait ici une fenêtre de double consommation.
    """
    await _register(auth_client, verify_payload, expected=201)
    token = _token_from(sent_links[0])

    first, second = await asyncio.gather(
        _verify(auth_client, token),
        _verify(auth_client, token),
    )

    codes = sorted([first.status_code, second.status_code])
    assert codes == [200, 400], f"issues obtenues : {codes}"

    async with _session_factory()() as session:
        result = await session.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token_hash
                == hash_verification_token(token, get_settings().email_verification_token_pepper)
            )
        )
        assert result.scalar_one().used_at is not None


# --------------------------------------------------------------------- renvoi


async def test_resend_verification_answers_the_same_for_an_unknown_address(
    pepper_env: None,
    auth_client: AsyncClient,
    sent_links: list[str],
) -> None:
    response = await auth_client.post(
        "/api/v1/auth/resend-verification",
        json={"email": f"inconnu-{uuid.uuid4().hex[:8]}@example.com"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == GENERIC_RESEND_MESSAGE
    assert sent_links == [], "aucun e-mail ne doit partir pour une adresse inconnue"


async def test_resend_verification_answers_the_same_for_a_verified_account(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    assert (await _verify(auth_client, _token_from(sent_links[0]))).status_code == 200
    sent_links.clear()

    response = await auth_client.post(
        "/api/v1/auth/resend-verification",
        json={"email": verify_payload["email"]},
    )
    assert response.status_code == 200
    assert response.json()["message"] == GENERIC_RESEND_MESSAGE
    assert sent_links == [], "un compte déjà vérifié ne doit pas recevoir de nouveau lien"


async def test_resend_verification_invalidates_the_previous_link(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    first_token = _token_from(sent_links[0])

    # Le délai minimal entre deux envois porte sur la date d'émission : on la
    # recule pour éprouver le renvoi lui-même, pas l'horloge.
    await _age_last_token(verify_payload["email"])

    response = await auth_client.post(
        "/api/v1/auth/resend-verification",
        json={"email": verify_payload["email"]},
    )
    assert response.status_code == 200
    assert len(sent_links) == 2

    stale = await _verify(auth_client, first_token)
    assert stale.status_code == 400
    assert stale.json()["code"] == "VERIFICATION_TOKEN_ALREADY_USED"

    assert (await _verify(auth_client, _token_from(sent_links[1]))).status_code == 200


async def test_resend_verification_respects_the_minimum_delay(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)

    response = await auth_client.post(
        "/api/v1/auth/resend-verification",
        json={"email": verify_payload["email"]},
    )

    assert response.status_code == 200
    assert response.json()["message"] == GENERIC_RESEND_MESSAGE, (
        "le refus doit être indiscernable d'un envoi"
    )
    assert len(sent_links) == 1, "aucun second envoi avant la fin du délai"


async def _age_last_token(email: str) -> None:
    """Recule la date d'émission du dernier jeton au-delà du délai minimal."""
    async with _session_factory()() as session:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one()
        result = await session.execute(
            select(EmailVerificationToken)
            .where(EmailVerificationToken.user_id == user.id)
            .order_by(EmailVerificationToken.created_at.desc())
            .limit(1)
        )
        stored = result.scalar_one()
        stored.created_at = datetime.now(UTC) - timedelta(minutes=5)
        session.add(stored)
        await session.commit()


# --------------------------------------------------------------------- secrets


async def test_the_clear_token_is_never_persisted(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    await _register(auth_client, verify_payload, expected=201)
    token = _token_from(sent_links[0])

    async with _session_factory()() as session:
        rows = (await session.execute(select(EmailVerificationToken))).scalars().all()

    assert rows
    for row in rows:
        assert row.token_hash != token
        assert len(row.token_hash) == 64
    assert any(row.token_hash == hash_verification_token(token, _PEPPER) for row in rows), (
        "l'empreinte stockée doit être celle du pepper dédié"
    )


async def test_the_refresh_pepper_cannot_forge_a_verification_token(
    pepper_env: None,
    auth_client: AsyncClient,
    verify_payload: dict[str, str],
    sent_links: list[str],
) -> None:
    """Les deux peppers sont distincts : compromettre l'un ne donne pas l'autre."""
    settings = get_settings()
    assert settings.email_verification_token_pepper == _PEPPER
    assert settings.email_verification_token_pepper != settings.refresh_token_pepper

    await _register(auth_client, verify_payload, expected=201)
    token = _token_from(sent_links[0])

    forged = hash_verification_token(token, settings.refresh_token_pepper)
    async with _session_factory()() as session:
        result = await session.execute(
            select(EmailVerificationToken).where(EmailVerificationToken.token_hash == forged)
        )
        assert result.scalar_one_or_none() is None
