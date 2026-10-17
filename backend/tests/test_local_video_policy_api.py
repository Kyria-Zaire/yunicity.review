"""VIDEO-04D — preuve bout-en-bout du palier createur via l'API (integration).

Attribution `VERIFIED_CREATOR` -> politique 180 s ; revocation -> retour a 90 s.
Le role ne confere aucune permission administrative.

Le seed idempotent, l'attribution/revocation ADMIN-08B et l'audit sont deja
couverts par `test_auth_rbac_seed.py` et `test_admin_staff_api.py`, qui iterent
`ROLE_DEFINITIONS` et englobent donc automatiquement le nouveau role.
"""

from __future__ import annotations

import os

import pytest
from app.core.local_video_duration_policy import VERIFIED_CREATOR_ROLE_KEY
from httpx import AsyncClient

from tests.conftest_rbac import RbacUserFactory, assign_roles, auth_header

# Module d'integration : sans base configuree (run unit-only type `backend-ci`),
# tout le module est ignore — la route depend de `get_db`, qui echoue sans DSN.
pytestmark = [
    pytest.mark.integration,
    pytest.mark.asyncio,
    pytest.mark.skipif(
        not os.environ.get("TEST_DATABASE_URL") and not os.environ.get("DATABASE_URL"),
        reason="base de test non configuree",
    ),
]

POLICY_URL = "/api/v1/local-videos/policy"


async def _revoke_role(user_id, role_key: str) -> None:  # type: ignore[no-untyped-def]
    """Revocation directe, symetrique de `assign_roles` du conftest RBAC."""
    from app.db.session import get_session_factory
    from app.services.rbac_service import RbacService

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        await RbacService(session).remove_role_from_user(user_id, role_key)
        await session.commit()



async def test_policy_requires_authentication(auth_client: AsyncClient) -> None:
    """`auth_client` (et non `client`) : c'est lui qui initialise la base — la route
    resout `get_db` avant meme la garde d'authentification."""
    response = await auth_client.get(POLICY_URL)
    assert response.status_code == 401


async def test_default_user_gets_pilot_ninety(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory()
    response = await client.get(POLICY_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    body = response.json()
    assert body["tier"] == "pilot"
    assert body["max_duration_seconds"] == 90


async def test_verified_creator_gets_one_eighty(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    user = await rbac_user_factory(VERIFIED_CREATOR_ROLE_KEY)
    response = await client.get(POLICY_URL, headers=auth_header(user.access_token))
    assert response.status_code == 200
    body = response.json()
    assert body["tier"] == "verified"
    assert body["max_duration_seconds"] == 180


async def test_staff_without_the_role_stays_pilot(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Un staff plateforme n'obtient pas 180 s sans le role produit."""
    user = await rbac_user_factory("SUPER_ADMIN")
    response = await client.get(POLICY_URL, headers=auth_header(user.access_token))
    assert response.json()["max_duration_seconds"] == 90


async def test_assign_then_revoke_returns_to_pilot(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Attribution -> 180, revocation -> retour immediat a 90."""
    user = await rbac_user_factory()
    headers = auth_header(user.access_token)
    assert (await client.get(POLICY_URL, headers=headers)).json()["max_duration_seconds"] == 90

    await assign_roles(user.user_id, VERIFIED_CREATOR_ROLE_KEY)
    assert (await client.get(POLICY_URL, headers=headers)).json()["max_duration_seconds"] == 180

    await _revoke_role(user.user_id, VERIFIED_CREATOR_ROLE_KEY)
    apres = (await client.get(POLICY_URL, headers=headers)).json()
    assert apres["tier"] == "pilot"
    assert apres["max_duration_seconds"] == 90


async def test_client_cannot_choose_its_tier(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Aucun parametre client n'influence la politique servie."""
    user = await rbac_user_factory()
    headers = auth_header(user.access_token)
    response = await client.get(
        f"{POLICY_URL}?tier=verified&creator_tier=verified&max_duration_seconds=300",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["tier"] == "pilot"
    assert response.json()["max_duration_seconds"] == 90


async def test_verified_creator_gains_no_admin_access(
    client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Le role produit ne doit ouvrir aucune surface d'administration."""
    user = await rbac_user_factory(VERIFIED_CREATOR_ROLE_KEY)
    response = await client.get("/api/v1/admin/staff", headers=auth_header(user.access_token))
    assert response.status_code == 403
