"""Teasers vidéo territoriaux — contrat du détail quartier (VIDEO-03-TEASERS-03).

La fiche quartier reçoit déjà ses vidéos dans sa charge utile : elle n'a donc
aucune requête supplémentaire à faire pour les afficher. Ce qui lui manquait,
c'est le rattachement réel de chaque vidéo — lieu ou événement — sans lequel le
CTA « Y aller » ne peut pas exister honnêtement.

Ces tests verrouillent ce contrat et les filtres qui le protègent : seules des
vidéos publiées, prêtes, d'un auteur actif et du VRAI quartier peuvent sortir.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.core.local_video_constants import LocalVideoStatus, LocalVideoType
from app.core.organization_constants import (
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.db.session import get_engine
from app.models.cultural_place import CulturalPlace
from app.models.local_event import LocalEvent
from app.models.local_video import LocalVideo
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import event as sa_event
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_HOOD = "saint-remi"
_AUTRE_HOOD = "clairmarais"


async def _session_factory() -> async_sessionmaker[AsyncSession]:
    engine = get_engine()
    assert engine is not None
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _hood_id(session: AsyncSession, slug: str) -> uuid.UUID:
    hood = (
        await session.execute(
            select(Neighborhood).where(
                Neighborhood.city == "Reims",
                Neighborhood.slug == slug,
            )
        )
    ).scalar_one()
    return hood.id


async def _author(session: AsyncSession, *, is_active: bool = True) -> uuid.UUID:
    user = User(
        email=f"teaser-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="hashed",
        full_name="Teaser Author",
        city="Reims",
        is_active=is_active,
    )
    session.add(user)
    await session.flush()
    return user.id


def _video(**kwargs: object) -> LocalVideo:
    base: dict[str, object] = {
        "city": "Reims",
        "video_type": LocalVideoType.QUARTIER.value,
        "storage_key": f"local-video/reims/{uuid.uuid4()}/processed.mp4",
        "media_url": "https://cdn.test/teaser.mp4",
        "thumbnail_url": "https://cdn.test/teaser.jpg",
        "duration_seconds": 12.0,
        "file_size_bytes": 4096,
        "mime_type": "video/mp4",
        "status": LocalVideoStatus.PUBLISHED.value,
        "published_at": datetime.now(UTC),
    }
    base.update(kwargs)
    return LocalVideo(**base)  # type: ignore[arg-type]


async def _place(session: AsyncSession, hood_id: uuid.UUID, slug: str) -> uuid.UUID:
    place = CulturalPlace(
        slug=slug,
        name="Basilique Saint-Remi",
        short_description="Lieu lié à la vidéo.",
        city="Reims",
        neighborhood_id=hood_id,
        address="Place du Chanoine Ladame",
        latitude=49.2405,
        longitude=4.0386,
        category="monument",
        source_name="test",
        is_active=True,
    )
    session.add(place)
    await session.flush()
    return place.id


async def _event(session: AsyncSession, hood_id: uuid.UUID, author_id: uuid.UUID) -> uuid.UUID:
    org = Organization(
        slug=f"teaser-org-{uuid.uuid4().hex[:8]}",
        name="Org Teaser",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
        neighborhood_id=hood_id,
    )
    session.add(org)
    await session.flush()
    local_event = LocalEvent(
        organization_id=org.id,
        created_by_user_id=author_id,
        title="Concert Saint-Remi",
        description="Un événement lié à la vidéo.",
        city="Reims",
        neighborhood_id=hood_id,
        location_name="Basilique Saint-Remi",
        starts_at=datetime.now(UTC) + timedelta(days=3),
        ends_at=datetime.now(UTC) + timedelta(days=3, hours=2),
        visibility=LocalEventVisibility.PUBLIC.value,
        moderation_status=LocalEventModerationStatus.APPROVED.value,
    )
    session.add(local_event)
    await session.flush()
    return local_event.id


async def _detail(client: AsyncClient, slug: str = _HOOD):
    return await client.get(f"/api/v1/neighborhoods/{slug}?city=Reims")


async def test_teaser_exposes_the_linked_place(auth_client: AsyncClient) -> None:
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session)
        place_slug = f"basilique-teaser-{uuid.uuid4().hex[:6]}"
        place_id = await _place(session, hood_id, place_slug)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title="Vidéo avec lieu",
                cultural_place_id=place_id,
            )
        )
        await session.commit()

    response = await _detail(auth_client)
    assert response.status_code == 200
    videos = response.json()["videos"]
    cible = next(v for v in videos if v["title"] == "Vidéo avec lieu")
    assert cible["cultural_place_slug"] == place_slug
    assert cible["cultural_place_name"] == "Basilique Saint-Remi"
    assert cible["local_event_id"] is None


async def test_teaser_exposes_the_linked_event(auth_client: AsyncClient) -> None:
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session)
        event_id = await _event(session, hood_id, author_id)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title="Vidéo avec événement",
                local_event_id=event_id,
            )
        )
        await session.commit()

    response = await _detail(auth_client)
    assert response.status_code == 200
    cible = next(v for v in response.json()["videos"] if v["title"] == "Vidéo avec événement")
    assert cible["local_event_id"] == str(event_id)
    assert cible["cultural_place_slug"] is None


async def test_teaser_without_link_carries_no_destination(auth_client: AsyncClient) -> None:
    """Sans lieu ni événement, le frontend doit masquer « Y aller » — pas l'inventer."""
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title="Vidéo sans rattachement",
            )
        )
        await session.commit()

    response = await _detail(auth_client)
    cible = next(v for v in response.json()["videos"] if v["title"] == "Vidéo sans rattachement")
    assert cible["cultural_place_slug"] is None
    assert cible["cultural_place_name"] is None
    assert cible["local_event_id"] is None


async def test_teaser_never_shows_a_video_from_another_neighborhood(
    auth_client: AsyncClient,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        autre_id = await _hood_id(session, _AUTRE_HOOD)
        author_id = await _author(session)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=autre_id,
                title="Vidéo d'un autre quartier",
            )
        )
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title="Vidéo du bon quartier",
            )
        )
        await session.commit()

    titres = [v["title"] for v in (await _detail(auth_client)).json()["videos"]]
    assert "Vidéo d'un autre quartier" not in titres
    assert all(
        v["neighborhood_slug"] == _HOOD for v in (await _detail(auth_client)).json()["videos"]
    )


@pytest.mark.parametrize(
    "status",
    [
        LocalVideoStatus.PROCESSING.value,
        LocalVideoStatus.FAILED.value,
        LocalVideoStatus.HIDDEN.value,
        LocalVideoStatus.DELETED.value,
    ],
)
async def test_teaser_excludes_videos_that_are_not_published(
    auth_client: AsyncClient, status: str
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title=f"Vidéo {status}",
                status=status,
                published_at=None,
            )
        )
        await session.commit()

    titres = [v["title"] for v in (await _detail(auth_client)).json()["videos"]]
    assert f"Vidéo {status}" not in titres


async def test_teaser_excludes_videos_from_an_inactive_author(
    auth_client: AsyncClient,
) -> None:
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session, is_active=False)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood_id,
                title="Vidéo d'un auteur désactivé",
            )
        )
        await session.commit()

    titres = [v["title"] for v in (await _detail(auth_client)).json()["videos"]]
    assert "Vidéo d'un auteur désactivé" not in titres


async def test_an_inactive_neighborhood_exposes_no_teaser(auth_client: AsyncClient) -> None:
    """Un des trois secteurs fusionnés désactivés ne doit exposer aucune vidéo.

    La route entière répond 404 : ses vidéos sont donc inatteignables par
    construction, sans filtre supplémentaire à maintenir.
    """
    factory = await _session_factory()
    async with factory() as session:
        hood = (
            await session.execute(
                select(Neighborhood).where(
                    Neighborhood.city == "Reims",
                    Neighborhood.slug == _AUTRE_HOOD,
                )
            )
        ).scalar_one()
        author_id = await _author(session)
        session.add(
            _video(
                author_user_id=author_id,
                neighborhood_id=hood.id,
                title="Vidéo d'un quartier désactivé",
            )
        )
        hood.is_active = False
        await session.commit()

    try:
        response = await _detail(auth_client, _AUTRE_HOOD)
        assert response.status_code == 404
    finally:
        async with factory() as session:
            hood = (
                await session.execute(
                    select(Neighborhood).where(
                        Neighborhood.city == "Reims",
                        Neighborhood.slug == _AUTRE_HOOD,
                    )
                )
            ).scalar_one()
            hood.is_active = True
            await session.commit()


async def test_teaser_place_link_does_not_add_a_query_per_video(
    auth_client: AsyncClient,
) -> None:
    """Le lieu lié est chargé en lot : le budget SQL ne suit pas le nombre de vidéos."""
    factory = await _session_factory()
    async with factory() as session:
        hood_id = await _hood_id(session, _HOOD)
        author_id = await _author(session)
        for index in range(3):
            place_id = await _place(session, hood_id, f"lieu-n1-{uuid.uuid4().hex[:6]}")
            session.add(
                _video(
                    author_user_id=author_id,
                    neighborhood_id=hood_id,
                    title=f"Vidéo N+1 {index}",
                    cultural_place_id=place_id,
                    published_at=datetime.now(UTC) - timedelta(minutes=index),
                )
            )
        await session.commit()

    compteur = {"requetes": 0}

    def _on_execute(*_args: object, **_kwargs: object) -> None:
        compteur["requetes"] += 1

    engine = get_engine()
    assert engine is not None
    sync_engine = engine.sync_engine
    sa_event.listen(sync_engine, "before_cursor_execute", _on_execute)
    try:
        compteur["requetes"] = 0
        response = await _detail(auth_client)
        requetes = compteur["requetes"]
    finally:
        sa_event.remove(sync_engine, "before_cursor_execute", _on_execute)

    assert response.status_code == 200
    videos = response.json()["videos"]
    assert len(videos) >= 2
    assert all(v["cultural_place_slug"] for v in videos)
    # Un chargement par vidéo ferait exploser ce budget ; le lot le garde constant.
    assert requetes < 40, f"budget SQL suspect pour {len(videos)} vidéos : {requetes}"
