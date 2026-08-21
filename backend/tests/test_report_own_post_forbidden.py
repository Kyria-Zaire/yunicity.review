"""C3.1-R1L — on ne signale pas sa propre publication.

Défaut fermé ici : le menu du fil mobile proposait Spam / Contenu inapproprié /
Autre sur la publication de l'utilisateur connecté lui-même. Le correctif retire
l'action de l'interface, mais masquer un bouton n'est pas une règle : sans garde
serveur, un appel direct continuait de créer un signalement et de polluer la
file de modération. La règle est donc portée par l'API, et testée ici.

Le signalement d'un TIERS reste inchangé — c'est le parcours légitime.
"""

from __future__ import annotations

from typing import Any, cast

import pytest
from httpx import AsyncClient

from tests.test_feed import _register

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture(autouse=True)
def disable_auth_rate_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


async def _create_post(client: AsyncClient, token: str, body: str) -> str:
    response = await client.post(
        "/api/v1/posts",
        json={"body": body},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    return cast(str, cast(dict[str, Any], response.json())["id"])


async def test_reporting_own_post_is_refused(auth_client: AsyncClient) -> None:
    author = await _register(auth_client, suffix="-r1l-self", city="Reims")
    token = cast(str, author["access_token"])
    post_id = await _create_post(auth_client, token, "Publication de l'auteur (R1L)")

    response = await auth_client.post(
        f"/api/v1/posts/{post_id}/report",
        json={"reason": "spam"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400, response.text
    assert cast(dict[str, Any], response.json())["code"] == "CANNOT_REPORT_OWN_POST"


async def test_reporting_someone_elses_post_still_works(auth_client: AsyncClient) -> None:
    author = await _register(auth_client, suffix="-r1l-author", city="Reims")
    reporter = await _register(auth_client, suffix="-r1l-reporter", city="Reims")

    post_id = await _create_post(
        auth_client,
        cast(str, author["access_token"]),
        "Publication d'un tiers (R1L)",
    )

    response = await auth_client.post(
        f"/api/v1/posts/{post_id}/report",
        json={"reason": "spam"},
        headers={"Authorization": f"Bearer {cast(str, reporter['access_token'])}"},
    )

    assert response.status_code == 204, response.text
