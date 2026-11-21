"""Plafond global atomique — AUTH-04A-CORRECTION-02.

Le mécanisme précédent lisait le compteur, créait le compte, puis incrémentait.
Sous concurrence, plusieurs requêtes lisaient la même valeur avant qu'aucune
n'ait incrémenté : le plafond pouvait être dépassé d'autant que la charge le
permettait. La réservation est désormais un script Lua unique — vérification,
incrément et TTL ensemble.

Ces tests s'exécutent contre un vrai Redis : la propriété à démontrer est celle
du serveur, pas celle d'une simulation.
"""

from __future__ import annotations

import asyncio
import uuid

import pytest
from app.core.config import get_settings
from app.core.rate_limit import release_slot, reserve_slot
from app.integrations.redis import close_redis, get_redis_client, init_redis

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def redis_client(auth_env: None):  # type: ignore[no-untyped-def]
    await init_redis(get_settings())
    client = get_redis_client()
    if client is None:
        pytest.skip("Redis non configuré dans cet environnement de test")
    yield client
    await close_redis()


def _cle() -> str:
    return f"rl:test:global:{uuid.uuid4().hex}"


async def test_120_concurrent_reservations_never_exceed_100(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Le cas exact demandé : 120 requêtes simultanées, plafond 100."""
    cle = _cle()
    resultats = await asyncio.gather(*(reserve_slot(cle, 100, 3600) for _ in range(120)))

    acceptes = sum(1 for ok in resultats if ok)
    refuses = len(resultats) - acceptes

    assert acceptes == 100, f"reservations accordees : {acceptes}, attendu exactement 100"
    assert refuses == 20, f"refus : {refuses}, attendu 20"
    assert int(await redis_client.get(cle)) == 100, "le compteur ne doit jamais depasser"


async def test_the_reservation_key_always_has_a_ttl(redis_client) -> None:  # type: ignore[no-untyped-def]
    cle = _cle()
    await reserve_slot(cle, 10, 3600)

    ttl = await redis_client.ttl(cle)
    assert ttl > 0, "une cle sans TTL bloquerait les inscriptions jusqu'a intervention"
    assert ttl <= 3600


async def test_a_key_inherited_without_ttl_is_repaired(redis_client) -> None:  # type: ignore[no-untyped-def]
    cle = _cle()
    await redis_client.set(cle, 5)
    assert await redis_client.ttl(cle) == -1

    await reserve_slot(cle, 100, 3600)

    assert await redis_client.ttl(cle) > 0


async def test_a_failed_creation_gives_its_slot_back(redis_client) -> None:  # type: ignore[no-untyped-def]
    """La compensation : le plafond compte des comptes créés, pas des tentatives."""
    cle = _cle()
    for _ in range(100):
        assert await reserve_slot(cle, 100, 3600) is True
    assert await reserve_slot(cle, 100, 3600) is False, "plafond atteint"

    await release_slot(cle)

    assert await reserve_slot(cle, 100, 3600) is True, "la place rendue doit etre reutilisable"
    assert int(await redis_client.get(cle)) == 100


async def test_a_repeated_compensation_never_goes_negative(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Double compensation : sans effet, jamais de compteur négatif.

    Un compteur négatif offrirait des inscriptions gratuites au-delà du plafond.
    """
    cle = _cle()
    await reserve_slot(cle, 100, 3600)

    for _ in range(5):
        await release_slot(cle)

    valeur = int(await redis_client.get(cle) or 0)
    assert valeur == 0, f"compteur = {valeur}, il ne doit jamais passer sous zero"

    # Et le plafond reste entier ensuite.
    resultats = await asyncio.gather(*(reserve_slot(cle, 100, 3600) for _ in range(120)))
    assert sum(1 for ok in resultats if ok) == 100


async def test_concurrent_compensation_and_reservation_stay_consistent(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Réservations et compensations entremêlées : le compteur reste cohérent."""
    cle = _cle()
    await asyncio.gather(*(reserve_slot(cle, 50, 3600) for _ in range(50)))

    await asyncio.gather(
        *(release_slot(cle) for _ in range(10)),
        *(reserve_slot(cle, 50, 3600) for _ in range(10)),
    )

    valeur = int(await redis_client.get(cle) or 0)
    assert 0 <= valeur <= 50, f"compteur hors bornes : {valeur}"


async def test_one_ip_may_fill_the_whole_global_ceiling(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Une seule IP doit pouvoir consommer tout le plafond global.

    C'est la conséquence directe du choix de ne plus faire porter la décision par
    l'IP : cent personnes d'une même salle occupent légitimement les cent places.
    """
    cle = _cle()
    accordees = sum([await reserve_slot(cle, 100, 3600) for _ in range(100)])
    assert accordees == 100
