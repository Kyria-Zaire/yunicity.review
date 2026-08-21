"""C3.1-R1K — sûreté de la rotation du refresh token face à un rejeu autorisé.

Défaut fermé ici (prouvé en C3.1-R1J, 701 événements instrumentés) : une
navigation qui interrompt un ``POST /api/v1/auth/refresh`` déjà traité par le
serveur laisse le client sans le cookie successeur. La rotation a pourtant eu
lieu. Le chargement suivant rejoue donc le token consommé, la détection de
réutilisation révoque la famille, et l'utilisateur est déconnecté sans avoir
rien fait d'anormal — mesuré : ``401 POST /auth/refresh`` puis 58 à 115 ms plus
tard ``redirect_login /login?next=<route>``.

Contrat verrouillé ici : la rotation reste obligatoire et à usage unique, mais
un rejeu du MÊME token dans une fenêtre courte renvoie EXACTEMENT le même
successeur, sans jamais en créer un second. Passé la fenêtre, la détection de
réutilisation et la révocation de famille sont inchangées.

L'écoulement du temps est simulé par une horloge injectée
(``refresh_rotation_grace.utcnow``) : aucun test n'attend réellement, sinon la
suite deviendrait lente et non déterministe.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.config import Settings, get_settings
from app.core.security import hash_refresh_token
from app.db.session import get_engine
from app.models.refresh_token import RefreshToken
from httpx import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

REFRESH_URL = "/api/v1/auth/refresh"


# --------------------------------------------------------------------------- #
# Utilitaires
# --------------------------------------------------------------------------- #
def _cookie_name(settings: Settings) -> str:
    return settings.refresh_cookie_name


def _current_refresh(client: AsyncClient, settings: Settings) -> str:
    raw = client.cookies.get(_cookie_name(settings))
    assert raw, "cookie de refresh absent du client de test"
    return raw


async def _refresh_with(client: AsyncClient, settings: Settings, raw: str) -> Response:
    """Rejoue explicitement `raw`, sans dépendre de l'état du bocal à cookies."""
    client.cookies.set(_cookie_name(settings), raw)
    return await client.post(REFRESH_URL)


def _returned_refresh(response: Response, settings: Settings) -> str | None:
    return response.cookies.get(_cookie_name(settings))


def _sessions() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _row_for(raw: str, settings: Settings) -> RefreshToken | None:
    token_hash = hash_refresh_token(raw, settings.refresh_token_pepper)
    async with _sessions()() as session:
        result = await session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()


async def _family_rows(family_id: uuid.UUID) -> list[RefreshToken]:
    async with _sessions()() as session:
        result = await session.execute(
            select(RefreshToken).where(RefreshToken.family_id == family_id)
        )
        return list(result.scalars().all())


def _freeze(monkeypatch: pytest.MonkeyPatch, moment: datetime) -> None:
    """Horloge injectée : la fenêtre est franchie sans aucune attente réelle."""
    monkeypatch.setattr(
        "app.services.refresh_rotation_grace.utcnow",
        lambda: moment,
    )


async def _redis_client() -> Any:
    settings = get_settings()
    assert settings.redis_url, "ces tests exigent un Redis (REDIS_URL)"
    from redis.asyncio import Redis

    return Redis.from_url(settings.redis_url, decode_responses=True)


@pytest.fixture
async def registered(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> tuple[AsyncClient, Settings]:
    response = await auth_client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201, response.text
    return auth_client, get_settings()


# --------------------------------------------------------------------------- #
# 1. La rotation reste la règle
# --------------------------------------------------------------------------- #
async def test_rotation_still_issues_a_distinct_successor(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Décisions 1 et 2 : aucun refresh token non tournant n'est toléré."""
    client, settings = registered
    original = _current_refresh(client, settings)

    response = await client.post(REFRESH_URL)
    assert response.status_code == 200, response.text

    successor = _returned_refresh(response, settings)
    assert successor, "la rotation doit émettre un cookie successeur"
    assert successor != original, "le refresh token doit tourner à chaque usage"

    consumed = await _row_for(original, settings)
    assert consumed is not None
    assert consumed.replaced_by_token_id is not None, "le prédécesseur doit être marqué tourné"


# --------------------------------------------------------------------------- #
# 2 & 3. Rejeu autorisé dans la fenêtre
# --------------------------------------------------------------------------- #
async def test_replay_within_window_returns_exactly_the_same_successor(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Décision 5 : un rejeu autorisé renvoie EXACTEMENT le même successeur."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200, first.text
    successor = _returned_refresh(first, settings)
    assert successor

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 200, (
        "un rejeu dans la fenêtre ne doit pas déconnecter l'utilisateur : " + replay.text
    )
    assert _returned_refresh(replay, settings) == successor
    assert replay.json()["access_token"], "un jeton d'accès frais reste nécessaire au client"


async def test_replay_within_window_creates_no_second_successor(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Décision 6 : ni second successeur, ni branchement de famille."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200
    await _refresh_with(client, settings, original)

    consumed = await _row_for(original, settings)
    assert consumed is not None
    rows = await _family_rows(consumed.family_id)
    assert len(rows) == 2, (
        "la famille doit contenir le prédécesseur et son unique successeur, "
        f"trouvé : {len(rows)}"
    )
    successors = [row for row in rows if row.id != consumed.id]
    assert len(successors) == 1
    assert consumed.replaced_by_token_id == successors[0].id


async def test_replay_does_not_extend_absolute_expiry(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """La fenêtre ne prolonge aucune durée de vie absolue."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    successor = _returned_refresh(first, settings)
    assert successor
    before = await _row_for(successor, settings)
    assert before is not None
    expiry_before = before.expires_at

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 200

    after = await _row_for(successor, settings)
    assert after is not None
    assert after.expires_at == expiry_before, "l'expiration absolue ne doit jamais être repoussée"


# --------------------------------------------------------------------------- #
# 4 & 5. Après la fenêtre : comportement de sécurité inchangé
# --------------------------------------------------------------------------- #
async def test_replay_after_window_is_rejected_as_reuse(
    registered: tuple[AsyncClient, Settings],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Décision 7 : passé la fenêtre, la détection de réutilisation reprend."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200

    _freeze(monkeypatch, datetime.now(UTC) + timedelta(seconds=3600))

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401, replay.text
    assert replay.json()["code"] == "REFRESH_TOKEN_REUSE"


async def test_replay_after_window_revokes_the_whole_family(
    registered: tuple[AsyncClient, Settings],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """La révocation de famille reste la réponse à un vrai rejeu."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    successor = _returned_refresh(first, settings)
    assert successor

    _freeze(monkeypatch, datetime.now(UTC) + timedelta(seconds=3600))
    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401

    consumed = await _row_for(original, settings)
    assert consumed is not None
    rows = await _family_rows(consumed.family_id)
    assert rows and all(row.revoked_at is not None for row in rows), (
        "toute la famille doit être révoquée après un rejeu hors fenêtre"
    )


# --------------------------------------------------------------------------- #
# 6. Atomicité
# --------------------------------------------------------------------------- #
async def test_concurrent_rotations_yield_a_single_successor(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Décision 8 : deux requêtes simultanées ne produisent qu'un successeur."""
    client, settings = registered
    original = _current_refresh(client, settings)
    client.cookies.set(_cookie_name(settings), original)

    first, second = await asyncio.gather(
        client.post(REFRESH_URL),
        client.post(REFRESH_URL),
    )

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert _returned_refresh(first, settings) == _returned_refresh(second, settings), (
        "les deux requêtes concurrentes doivent recevoir le même successeur"
    )

    consumed = await _row_for(original, settings)
    assert consumed is not None
    rows = await _family_rows(consumed.family_id)
    assert len(rows) == 2, f"famille branchée : {len(rows)} jetons au lieu de 2"


# --------------------------------------------------------------------------- #
# 7 & 8. Logout et révocation neutralisent la donnée temporaire
# --------------------------------------------------------------------------- #
async def test_logout_makes_the_replayable_successor_unusable(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """La donnée conservée doit devenir inutilisable dès le logout."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    successor = _returned_refresh(first, settings)
    assert successor

    client.cookies.set(_cookie_name(settings), successor)
    logout = await client.post("/api/v1/auth/logout")
    assert logout.status_code in (200, 204), logout.text

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401, (
        "après logout, le rejeu ne doit jamais ressusciter la session : " + replay.text
    )


async def test_family_revocation_makes_the_replayable_successor_unusable(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Une révocation globale prime sur la fenêtre de tolérance."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200
    consumed = await _row_for(original, settings)
    assert consumed is not None

    async with _sessions()() as session:
        from app.repositories.refresh_token_repository import RefreshTokenRepository

        await RefreshTokenRepository(session).revoke_all_for_user(consumed.user_id)
        await session.commit()

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401, replay.text


# --------------------------------------------------------------------------- #
# 9 & 10. Configuration et fail-closed
# --------------------------------------------------------------------------- #
async def test_window_is_configurable_and_bounded() -> None:
    """Décision 4 : durée par défaut 5 s, configurable, bornée."""
    defaults = Settings.model_fields["refresh_rotation_replay_window_seconds"]
    assert defaults.default == 5

    with pytest.raises(ValueError):
        Settings(REFRESH_ROTATION_REPLAY_WINDOW_SECONDS=-1)
    with pytest.raises(ValueError):
        Settings(REFRESH_ROTATION_REPLAY_WINDOW_SECONDS=3600)


async def test_zero_window_restores_strict_single_use_behaviour(
    registered: tuple[AsyncClient, Settings],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Fenêtre à 0 : comportement strict d'origine, sans aucune tolérance."""
    client, settings = registered
    monkeypatch.setattr(settings, "refresh_rotation_replay_window_seconds", 0)
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401
    assert replay.json()["code"] == "REFRESH_TOKEN_REUSE"


async def test_grace_is_fail_closed_when_redis_is_unavailable(
    registered: tuple[AsyncClient, Settings],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Redis en panne : on retombe sur le comportement strict, jamais sur une 500."""

    class _BrokenRedis:
        async def set(self, *_args: object, **_kwargs: object) -> bool:
            raise ConnectionError("redis indisponible")

        async def get(self, *_args: object, **_kwargs: object) -> str | None:
            raise ConnectionError("redis indisponible")

        async def delete(self, *_args: object, **_kwargs: object) -> int:
            raise ConnectionError("redis indisponible")

    monkeypatch.setattr(
        "app.services.refresh_rotation_grace.get_redis_client",
        lambda: _BrokenRedis(),
    )
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    assert first.status_code == 200, "une panne Redis ne doit pas casser la rotation"

    replay = await _refresh_with(client, settings, original)
    assert replay.status_code == 401
    assert replay.json()["code"] == "REFRESH_TOKEN_REUSE"


# --------------------------------------------------------------------------- #
# 11 & 12. Confidentialité de la donnée temporaire
# --------------------------------------------------------------------------- #
async def test_no_raw_token_and_no_db_hash_appears_in_a_redis_key(
    registered: tuple[AsyncClient, Settings],
) -> None:
    """Décision Mission 4 : aucune donnée sensible dans une CLÉ Redis."""
    client, settings = registered
    original = _current_refresh(client, settings)

    first = await _refresh_with(client, settings, original)
    successor = _returned_refresh(first, settings)
    assert successor

    redis = await _redis_client()
    try:
        keys = [str(key) for key in await redis.keys("*")]
    finally:
        await redis.aclose()

    joined = "\n".join(keys)
    assert original not in joined, "le token brut consommé ne doit jamais servir de clé"
    assert successor not in joined, "le token brut successeur ne doit jamais servir de clé"

    db_hash = hash_refresh_token(original, settings.refresh_token_pepper)
    assert db_hash not in joined, (
        "la clé ne doit pas reprendre la valeur stockée en base : "
        "un accès Redis en lecture donnerait un index direct sur la table"
    )
    assert any(key.startswith("auth:rotation:") for key in keys), (
        f"aucune entrée de rotation trouvée ; clés présentes : {keys}"
    )


async def test_replayable_successor_is_never_written_to_the_logs(
    registered: tuple[AsyncClient, Settings],
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Décision Mission 4 : la donnée conservée n'apparaît jamais dans les logs."""
    client, settings = registered
    original = _current_refresh(client, settings)

    with caplog.at_level("DEBUG"):
        first = await _refresh_with(client, settings, original)
        successor = _returned_refresh(first, settings)
        assert successor
        replay = await _refresh_with(client, settings, original)
        assert replay.status_code == 200

    everything = "\n".join(record.getMessage() for record in caplog.records)
    assert original not in everything, "un token brut ne doit jamais etre journalise"
    assert successor not in everything, "le successeur ne doit jamais etre journalise"

    # Le hash stocke en base transite par les journaux de SQLAlchemy, qui echoe ses
    # parametres lies quand `echo=settings.debug` est actif : comportement preexistant
    # du mode DEBUG, jamais actif hors developpement, et sans rapport avec ce ticket.
    # Ce hash n'est d'ailleurs pas presentable a l'API : seul le token brut ouvre une
    # session. L'assertion porte donc sur NOS journaux, ou rien de sensible ne doit
    # apparaitre.
    ours = "\n".join(
        record.getMessage() for record in caplog.records if record.name.startswith("app.")
    )
    assert hash_refresh_token(original, settings.refresh_token_pepper) not in ours
    assert "auth:rotation:" not in ours, "aucune cle de rotation ne doit etre journalisee"
