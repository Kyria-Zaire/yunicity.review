"""C3.1-R1H.1 — la baseline QA doit être relisible par l'API notifications.

Défaut fermé ici : le seed QA écrivait ``type="system"`` dans ``user_notifications``
alors que ``SocialNotificationType`` n'expose pas ce membre. La colonne est un
``VARCHAR(64)`` sans contrainte, donc l'écriture passait en silence et seule la
LECTURE échouait — ``GET /api/v1/notifications`` renvoyait 500 sur chaque page
authentifiée (``ValueError: 'system' is not a valid SocialNotificationType``),
sans qu'aucun test ne le voie.

Ces tests verrouillent le contrat dans les deux sens : ce que le seed écrit doit
appartenir au contrat public, et l'API doit savoir relire sa propre baseline.
"""

from __future__ import annotations

from typing import Any, cast

import pytest
from app.core.social_notification_constants import SocialNotificationType
from app.db.seeds.qa_fixtures import seed_qa_fixtures
from app.db.session import get_session_factory
from app.models.user_notification import UserNotification
from httpx import AsyncClient
from sqlalchemy import select

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

SEEDED_CITIZEN_EMAIL = "qa.citizen.a@example.com"
SEEDED_CITIZEN_PASSWORD = "StrongPassword1!"


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


async def _seed_qa_baseline() -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await seed_qa_fixtures(session)
        await session.commit()


async def _seeded_notification_types() -> list[str]:
    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        result = await session.execute(select(UserNotification.type))
        return [row[0] for row in result.all()]


async def _login(client: AsyncClient) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": SEEDED_CITIZEN_EMAIL, "password": SEEDED_CITIZEN_PASSWORD},
    )
    assert response.status_code == 200, response.text
    token = cast(dict[str, Any], response.json())["access_token"]
    assert isinstance(token, str) and token, "jeton d'accès absent de la réponse"
    return token


async def test_seeded_notification_types_belong_to_public_contract(
    auth_client: AsyncClient,
) -> None:
    """Le seed ne peut pas écrire un type absent du contrat public."""
    del auth_client  # le schéma et les seeds de base viennent de la fixture
    await _seed_qa_baseline()

    types = await _seeded_notification_types()
    assert types, "la baseline QA doit créer des notifications"

    allowed = {member.value for member in SocialNotificationType}
    invalid = sorted({value for value in types if value not in allowed})
    assert not invalid, (
        f"types hors contrat écrits par le seed QA : {invalid}. "
        f"Contrat public : {sorted(allowed)}"
    )


async def test_notifications_endpoint_reads_back_the_seeded_inbox(
    auth_client: AsyncClient,
) -> None:
    """L'API doit savoir relire la baseline qu'elle a elle-même semée."""
    await _seed_qa_baseline()
    token = await _login(auth_client)

    response = await auth_client.get(
        "/api/v1/notifications?limit=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text

    body = cast(dict[str, Any], response.json())
    allowed = {member.value for member in SocialNotificationType}
    for item in body["items"]:
        assert item["type"] in allowed, f"type hors contrat renvoyé : {item['type']}"
    assert body["unread_count"] >= 1
