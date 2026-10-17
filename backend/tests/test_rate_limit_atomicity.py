"""Atomicité du limiteur — AUTH-04A.

`INCR` puis `EXPIRE` en deux appels laissait une fenêtre : si le second échouait,
la clé restait sans durée de vie et l'adresse ou l'IP concernée était bloquée
**définitivement**, jusqu'à intervention manuelle sur Redis.

Ces tests s'exécutent contre un vrai Redis, parce que la propriété à vérifier est
précisément celle du serveur : un script exécuté d'un bloc.
"""

from __future__ import annotations

import asyncio
import uuid

import pytest
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.rate_limit import enforce_rate_limit
from app.integrations.redis import close_redis, get_redis_client, init_redis

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
async def redis_client(auth_env: None):  # type: ignore[no-untyped-def]
    settings = get_settings()
    await init_redis(settings)
    client = get_redis_client()
    if client is None:
        pytest.skip("Redis non configuré dans cet environnement de test")
    yield client
    await close_redis()


def _cle() -> str:
    return f"rl:test:auth04a:{uuid.uuid4().hex}"


async def test_the_window_always_has_a_ttl(redis_client) -> None:  # type: ignore[no-untyped-def]
    """La propriété qui manquait : jamais de clé permanente."""
    cle = _cle()
    await enforce_rate_limit(cle, limit=5, window_seconds=60)

    ttl = await redis_client.ttl(cle)
    assert ttl > 0, "une cle sans TTL bloque definitivement son sujet"
    assert ttl <= 60


async def test_the_ttl_survives_further_increments(redis_client) -> None:  # type: ignore[no-untyped-def]
    """La fenêtre reste fixe : les incréments suivants ne la prolongent pas."""
    cle = _cle()
    await enforce_rate_limit(cle, limit=5, window_seconds=60)
    premier = await redis_client.ttl(cle)

    for _ in range(3):
        await enforce_rate_limit(cle, limit=5, window_seconds=60)

    assert await redis_client.ttl(cle) <= premier


async def test_a_key_inherited_without_ttl_is_repaired(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Les clés déjà bloquées par l'ancien défaut doivent se débloquer seules."""
    cle = _cle()
    await redis_client.set(cle, 3)  # clé permanente, telle que l'ancien code pouvait en laisser
    assert await redis_client.ttl(cle) == -1

    await enforce_rate_limit(cle, limit=10, window_seconds=60)

    assert await redis_client.ttl(cle) > 0, "le rattrapage doit reposer un TTL"


async def test_the_limit_is_exact_under_sequential_load(redis_client) -> None:  # type: ignore[no-untyped-def]
    cle = _cle()
    for _ in range(5):
        await enforce_rate_limit(cle, limit=5, window_seconds=60)

    with pytest.raises(AppError) as refus:
        await enforce_rate_limit(cle, limit=5, window_seconds=60)
    assert refus.value.status_code == 429


async def test_concurrent_calls_never_exceed_the_limit(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Cinquante appels simultanés : exactement dix passent, jamais onze."""
    cle = _cle()
    limite = 10

    async def _tenter() -> bool:
        try:
            await enforce_rate_limit(cle, limit=limite, window_seconds=60)
            return True
        except AppError:
            return False

    resultats = await asyncio.gather(*(_tenter() for _ in range(50)))

    assert sum(resultats) == limite, f"acceptes : {sum(resultats)}, attendu {limite}"
    assert await redis_client.ttl(cle) > 0


async def test_a_hundred_people_behind_one_ip_can_register(redis_client) -> None:  # type: ignore[no-untyped-def]
    """Le cas qui a motivé le ticket : une salle entière derrière un seul NAT."""
    cle = _cle()
    # Plafond du mode PILOT.
    for rang in range(100):
        try:
            await enforce_rate_limit(cle, limit=120, window_seconds=3600)
        except AppError as refus:  # pragma: no cover - ne doit pas arriver
            pytest.fail(f"inscription bloquee au rang {rang} : {refus.code}")
