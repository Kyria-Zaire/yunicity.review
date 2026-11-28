"""Idempotence de la creation d'une publication (FEED-NEW-UX-01).

Le client du composer `/feed/new` envoie une cle `client_request_id` avec chaque
tentative. Une reponse perdue ne doit jamais produire de doublon, et une cle
rejouee avec un contenu DIFFERENT doit etre refusee explicitement.
"""

from __future__ import annotations

import asyncio
import uuid

import pytest
from app.db.session import get_session_factory
from app.models.post import Post
from app.repositories.post_repository import PostRepository
from httpx import AsyncClient
from sqlalchemy import func, select

from tests.conftest_passport import auth_header
from tests.test_feed import _register

pytestmark = [pytest.mark.integration]


async def _compter_publications(cle: str) -> int:
    """Compte les lignes RÉELLEMENT en base pour cette clé.

    Comparer deux `id` rendus par l'API ne prouve pas l'absence de doublon : seule la
    base le dit.
    """
    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        resultat = await session.execute(
            select(func.count())
            .select_from(Post)
            .where(Post.client_request_id == uuid.UUID(cle))
        )
        return int(resultat.scalar_one())


def _corps(cle: str, body: str = "Bonjour Reims") -> dict[str, str]:
    return {"author_type": "citizen", "body": body, "client_request_id": cle}


def _corps_riche(cle: str) -> dict[str, object]:
    """Un payload qui touche TOUTES les familles de champs du composer.

    Sert deux preuves d'un coup : l'empreinte reste stable sur un rejeu strictement
    identique (rien d'instable dans la serialisation), et une publication PROGRAMMEE
    -- donc `is_active=False` -- se retrouve bien par sa cle.
    """
    return {
        "author_type": "citizen",
        "body": "Marché de Noël place d'Erlon",
        "media_urls": [
            {"url": "https://cdn.example.com/erlon-1.jpg", "media_type": "image"},
            {"url": "https://cdn.example.com/erlon-2.mp4", "media_type": "video"},
        ],
        "location": {"latitude": 49.253, "longitude": 4.0317},
        "visibility": "custom",
        "audience_user_ids": [str(uuid.uuid4())],
        "tagged_user_ids": [str(uuid.uuid4()), str(uuid.uuid4())],
        "scheduled_at": "2099-01-01T10:00:00+00:00",
        "location_label": "Place d'Erlon",
        "activity_label": "Marché",
        "allow_comments": False,
        "allow_shares": False,
        "use_media_caption": True,
        "poll": {"question": "On y va ?", "options": ["Oui", "Plutôt samedi"]},
        "cross_post_targets": {"instagram": True, "tiktok": False},
        "client_request_id": cle,
    }


@pytest.mark.asyncio
async def test_replay_same_key_same_content_returns_same_post(
    auth_client: AsyncClient,
) -> None:
    """La réponse s'est perdue : le client rejoue, il ne doit PAS créer un doublon."""
    user = await _register(auth_client, suffix="-idem", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    premier = await auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes)
    second = await auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes)

    assert premier.status_code == 201, premier.text
    assert second.status_code == 200, second.text
    assert second.json()["id"] == premier.json()["id"]


@pytest.mark.asyncio
async def test_same_key_different_content_is_refused(auth_client: AsyncClient) -> None:
    """L'utilisateur a modifié son texte après une réponse perdue : refus EXPLICITE."""
    user = await _register(auth_client, suffix="-idem-conflit", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    premier = await auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes)
    conflit = await auth_client.post(
        "/api/v1/posts", json=_corps(cle, body="Texte modifié"), headers=entetes
    )

    assert premier.status_code == 201, premier.text
    assert conflit.status_code == 409, conflit.text
    assert conflit.json()["code"] == "POST_REQUEST_CONFLICT"


@pytest.mark.asyncio
async def test_concurrent_requests_create_one_post(auth_client: AsyncClient) -> None:
    """Deux requêtes SIMULTANÉES : l'unicité tient en base, pas sur un test préalable."""
    user = await _register(auth_client, suffix="-idem-course", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    premiere, seconde = await asyncio.gather(
        auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes),
        auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes),
    )

    assert {premiere.status_code, seconde.status_code} <= {200, 201}
    assert premiere.json()["id"] == seconde.json()["id"]
    # Les deux `id` peuvent coïncider sans que la base soit saine : on la compte.
    assert await _compter_publications(cle) == 1


@pytest.mark.asyncio
async def test_lost_race_recovers_through_the_unique_index(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """La pré-vérification PERD la course : c'est l'index unique qui tient l'unicité.

    `asyncio.gather` n'atteint pas ce chemin de façon fiable — en pratique la seconde
    requête voit déjà la ligne commitée et ressort par la pré-vérification. La branche
    `IntegrityError` restait donc du code jamais exécuté, alors qu'elle est la SEULE
    chose qui rende vrai le §3.5 du contrat.

    On force donc la perte de course : la pré-vérification est aveuglée le temps de la
    seconde tentative, l'INSERT frappe l'index, et c'est le rattrapage qui doit rendre
    **200** avec la **même** publication — et **une seule ligne en base**.
    """
    user = await _register(auth_client, suffix="-idem-course-forcee", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    premier = await auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes)
    assert premier.status_code == 201, premier.text

    reel = PostRepository.get_by_client_request
    appels: list[str] = []

    async def pre_verification_aveugle(
        self: PostRepository,
        *,
        author_id: uuid.UUID,
        client_request_id: uuid.UUID,
    ) -> Post | None:
        appels.append("appel")
        if len(appels) == 1:
            return None  # la pre-verification perd la course
        return await reel(self, author_id=author_id, client_request_id=client_request_id)

    monkeypatch.setattr(PostRepository, "get_by_client_request", pre_verification_aveugle)

    second = await auth_client.post("/api/v1/posts", json=_corps(cle), headers=entetes)

    assert second.status_code == 200, second.text
    assert second.json()["id"] == premier.json()["id"]
    # 1 = pre-verification aveuglee, 2 = relecture de rattrapage apres le rollback.
    assert len(appels) == 2, f"rattrapage non emprunte : {len(appels)} appel(s)"
    assert await _compter_publications(cle) == 1


@pytest.mark.asyncio
async def test_same_key_across_users_is_isolated(auth_client: AsyncClient) -> None:
    """La clé appartient à SON auteur : deux comptes, deux publications."""
    une = await _register(auth_client, suffix="-idem-a", city="Reims")
    deux = await _register(auth_client, suffix="-idem-b", city="Reims")
    cle = str(uuid.uuid4())

    a = await auth_client.post(
        "/api/v1/posts", json=_corps(cle), headers=auth_header(une["access_token"])
    )
    b = await auth_client.post(
        "/api/v1/posts", json=_corps(cle), headers=auth_header(deux["access_token"])
    )

    assert a.status_code == 201, a.text
    assert b.status_code == 201, b.text
    assert a.json()["id"] != b.json()["id"]


@pytest.mark.asyncio
async def test_same_key_different_audience_is_refused(auth_client: AsyncClient) -> None:
    """CONFIDENTIALITÉ : seule l'audience change, le refus doit être EXPLICITE.

    Le texte est identique, la visibilité aussi : seule la liste des destinataires
    diffère. Un 200 rendrait la première publication en abandonnant SILENCIEUSEMENT la
    nouvelle audience — l'auteur croirait avoir publié vers des personnes qu'il n'a
    jamais touchées.
    """
    user = await _register(auth_client, suffix="-idem-audience", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    def corps(destinataire: str) -> dict[str, object]:
        return {
            "author_type": "citizen",
            "body": "Bonjour Reims",
            "visibility": "custom",
            "audience_user_ids": [destinataire],
            "client_request_id": cle,
        }

    premier = await auth_client.post(
        "/api/v1/posts", json=corps(str(uuid.uuid4())), headers=entetes
    )
    conflit = await auth_client.post(
        "/api/v1/posts", json=corps(str(uuid.uuid4())), headers=entetes
    )

    assert premier.status_code == 201, premier.text
    assert conflit.status_code == 409, conflit.text
    assert conflit.json()["code"] == "POST_REQUEST_CONFLICT"


@pytest.mark.asyncio
async def test_same_key_different_schedule_is_refused(auth_client: AsyncClient) -> None:
    """Une autre FAMILLE de champs : la programmation. Pas un rattrapage ponctuel."""
    user = await _register(auth_client, suffix="-idem-programme", city="Reims")
    entetes = auth_header(user["access_token"])
    cle = str(uuid.uuid4())

    def corps(moment: str) -> dict[str, str]:
        return {
            "author_type": "citizen",
            "body": "Bonjour Reims",
            "scheduled_at": moment,
            "client_request_id": cle,
        }

    premier = await auth_client.post(
        "/api/v1/posts", json=corps("2099-01-01T10:00:00+00:00"), headers=entetes
    )
    conflit = await auth_client.post(
        "/api/v1/posts", json=corps("2099-01-02T10:00:00+00:00"), headers=entetes
    )

    assert premier.status_code == 201, premier.text
    assert conflit.status_code == 409, conflit.text
    assert conflit.json()["code"] == "POST_REQUEST_CONFLICT"


@pytest.mark.asyncio
async def test_identical_rich_payload_replay_still_returns_same_post(
    auth_client: AsyncClient,
) -> None:
    """L'élargissement ne doit PAS rendre l'empreinte instable.

    Toutes les familles de champs sont peuplées — médias, audience, programmation,
    sondage, position, cross-post. Un rejeu à l'octet près reste un rejeu : 200, même
    `id`. La publication étant programmée, elle est INACTIVE : la retrouver par sa clé
    prouve au passage que la relecture ne filtre pas sur `is_active`.
    """
    user = await _register(auth_client, suffix="-idem-riche", city="Reims")
    entetes = auth_header(user["access_token"])
    corps = _corps_riche(str(uuid.uuid4()))

    premier = await auth_client.post("/api/v1/posts", json=corps, headers=entetes)
    second = await auth_client.post("/api/v1/posts", json=corps, headers=entetes)

    assert premier.status_code == 201, premier.text
    assert second.status_code == 200, second.text
    assert second.json()["id"] == premier.json()["id"]
