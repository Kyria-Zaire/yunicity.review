"""VIDEO-03 — moteur de classement territorial du feed.

Deux niveaux :

- unitaire : la table de decision (tier -> motif -> libelle) et le curseur, qui
  doit porter le tier sans casser le format historique ;
- integration : la requete reelle, sur base jetable. C'est elle qui decide de
  l'ordre et de la pagination, donc elle qui doit etre verrouillee.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
import sqlalchemy as sa
from app.core.errors import AppError
from app.core.local_video_cursor import (
    decode_local_video_feed_cursor,
    encode_local_video_feed_cursor,
)
from app.core.local_video_feed_ranking import (
    FEED_NEIGHBORHOOD_MATCH_RADIUS_METERS,
    LocalVideoFeedReason,
    LocalVideoFeedTier,
    reason_for_tier,
    reason_label,
)
from app.db.base import Base
from app.repositories.local_video_repository import LocalVideoRepository
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# --------------------------------------------------------------------------
# Unitaire — table de decision et explicabilite
# --------------------------------------------------------------------------


@pytest.mark.unit
def test_tiers_are_ordered_by_decreasing_relevance() -> None:
    assert LocalVideoFeedTier.NEIGHBORHOOD < LocalVideoFeedTier.CITY
    assert LocalVideoFeedTier.CITY < LocalVideoFeedTier.TERRITORY_FALLBACK


@pytest.mark.unit
@pytest.mark.parametrize(
    ("tier", "attendu"),
    [
        (LocalVideoFeedTier.NEIGHBORHOOD, LocalVideoFeedReason.NEIGHBORHOOD_MATCH),
        (LocalVideoFeedTier.CITY, LocalVideoFeedReason.SAME_CITY),
        (LocalVideoFeedTier.TERRITORY_FALLBACK, LocalVideoFeedReason.TERRITORY_FALLBACK),
    ],
)
def test_each_tier_maps_to_a_stable_reason_code(
    tier: LocalVideoFeedTier, attendu: LocalVideoFeedReason
) -> None:
    assert reason_for_tier(tier) is attendu


@pytest.mark.unit
def test_the_neighborhood_reason_names_the_neighborhood() -> None:
    libelle = reason_label(
        LocalVideoFeedReason.NEIGHBORHOOD_MATCH,
        neighborhood_name="Saint-Remi",
        city="Reims",
    )
    assert libelle == "Parce que tu es à Saint-Remi"


@pytest.mark.unit
def test_the_neighborhood_reason_is_never_claimed_without_a_neighborhood() -> None:
    """Exigence explicite : ne jamais deduire ce motif si le quartier n'est pas etabli."""
    libelle = reason_label(
        LocalVideoFeedReason.NEIGHBORHOOD_MATCH,
        neighborhood_name=None,
        city="Reims",
    )
    assert "Parce que tu es" not in libelle


@pytest.mark.unit
def test_the_fallback_reason_never_names_a_neighborhood() -> None:
    libelle = reason_label(
        LocalVideoFeedReason.TERRITORY_FALLBACK,
        neighborhood_name="Saint-Remi",
        city="Reims",
    )
    assert "Saint-Remi" not in libelle


@pytest.mark.unit
def test_the_cursor_carries_the_tier() -> None:
    quand = datetime.now(UTC)
    vid = uuid.uuid4()
    tier, published, decoded_id = decode_local_video_feed_cursor(
        encode_local_video_feed_cursor(quand, vid, LocalVideoFeedTier.CITY.value)
    )
    assert tier == LocalVideoFeedTier.CITY.value
    assert decoded_id == vid
    assert published == quand


@pytest.mark.unit
def test_a_legacy_two_part_cursor_still_decodes() -> None:
    """Retrocompatibilite : un client deja en pagination ne doit pas casser."""
    quand = datetime.now(UTC)
    vid = uuid.uuid4()
    tier, published, decoded_id = decode_local_video_feed_cursor(
        encode_local_video_feed_cursor(quand, vid)
    )
    assert tier is None
    assert decoded_id == vid
    assert published == quand


@pytest.mark.unit
@pytest.mark.parametrize("mauvais", ["!!!", "Zm9v", "", "YQ==|Yg=="])
def test_an_invalid_cursor_is_rejected_cleanly(mauvais: str) -> None:
    with pytest.raises(AppError) as exc:
        decode_local_video_feed_cursor(mauvais)
    assert exc.value.code == "INVALID_CURSOR"
    assert exc.value.status_code == 400


# --------------------------------------------------------------------------
# Integration — la requete reelle
# --------------------------------------------------------------------------

_VILLE = "Reims"
# Centroides distincts : ~2,5 km separent les deux quartiers, donc un spectateur
# place sur l'un n'est jamais dans le rayon de l'autre.
_Q1 = (49.2530, 4.0330)
_Q2 = (49.2360, 4.0130)


def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    url = _database_url()
    if not url:
        pytest.skip("base de test non configuree")
    engine = create_async_engine(url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )
    async with factory() as s:
        yield s
    await engine.dispose()


async def _quartier(
    s: AsyncSession,
    *,
    slug: str,
    nom: str,
    lat: float,
    lon: float,
    actif: bool = True,
) -> uuid.UUID:
    nid = uuid.uuid4()
    await s.execute(
        sa.text(
            "INSERT INTO neighborhoods (id, city, slug, display_name, latitude, longitude,"
            " is_featured, is_active, created_at, updated_at)"
            " VALUES (:id, :city, :slug, :nom, :lat, :lon, false, :actif, now(), now())"
        ),
        {
            "id": nid,
            "city": _VILLE,
            "slug": slug,
            "nom": nom,
            "lat": lat,
            "lon": lon,
            "actif": actif,
        },
    )
    await s.flush()
    return nid


async def _auteur(s: AsyncSession, *, actif: bool = True) -> uuid.UUID:
    uid = uuid.uuid4()
    await s.execute(
        sa.text(
            "INSERT INTO users (id, email, hashed_password, full_name, is_active,"
            " is_verified, is_system_account, force_password_reset)"
            " VALUES (:id, :email, 'x', 'Feed VIDEO-03', :actif, false, false, false)"
        ),
        {"id": uid, "email": f"v3-{uid.hex[:10]}@example.com", "actif": actif},
    )
    await s.flush()
    return uid


async def _video(
    s: AsyncSession,
    *,
    auteur: uuid.UUID,
    quartier: uuid.UUID,
    minutes: int,
    statut: str = "published",
    ville: str = _VILLE,
    vid: uuid.UUID | None = None,
) -> uuid.UUID:
    vid = vid or uuid.uuid4()
    publie = datetime.now(UTC) - timedelta(minutes=minutes)
    await s.execute(
        sa.text(
            # Colonnes NOT NULL sans defaut du modele : author_user_id, city,
            # neighborhood_id, video_type, storage_key, media_url, thumbnail_url,
            # duration_seconds, file_size_bytes, mime_type.
            # `upload_id` est nullable et pointe sur `local_video_uploads` : on le
            # laisse NULL plutot que de fabriquer une session d'upload inutile ici.
            "INSERT INTO local_videos (id, author_user_id, city, neighborhood_id,"
            " video_type, storage_key, media_url, thumbnail_url, mime_type, duration_seconds,"
            " file_size_bytes, status, published_at, like_count, comment_count, view_count,"
            " created_at, updated_at)"
            " VALUES (:id, :a, :city, :n, 'quartier', :sk, :media, :thumb,"
            " 'video/mp4', 30, 1024, :st, :pub, 0, 0, 0, :created, :created)"
        ),
        {
            "id": vid,
            "a": auteur,
            "city": ville,
            "n": quartier,
            "sk": f"local-video/reims/{vid}/processed.mp4",
            "media": f"https://media.test/local-video/{vid}/processed.mp4",
            "thumb": f"https://media.test/local-video/{vid}/thumbnail.jpg",
            "st": statut,
            "pub": publie if statut == "published" else None,
            "created": publie,
        },
    )
    await s.flush()
    return vid


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_viewer_neighborhood_wins_over_the_rest_of_the_city(
    session: AsyncSession,
) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    q2 = await _quartier(session, slug="q2", nom="Quartier Deux", lat=_Q2[0], lon=_Q2[1])
    a = await _auteur(session)
    # La video de ville est PLUS RECENTE : sans classement territorial elle
    # sortirait premiere. Le tier doit primer sur la recence.
    await _video(session, auteur=a, quartier=q2, minutes=1)
    proche = await _video(session, auteur=a, quartier=q1, minutes=90)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    assert [t for _, t in page] == [
        LocalVideoFeedTier.NEIGHBORHOOD.value,
        LocalVideoFeedTier.CITY.value,
    ]
    assert page[0][0].id == proche


@pytest.mark.integration
@pytest.mark.asyncio
async def test_without_a_viewer_neighborhood_everything_is_fallback(
    session: AsyncSession,
) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    await _video(session, auteur=a, quartier=q1, minutes=5)
    await _video(session, auteur=a, quartier=q1, minutes=10)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=None
    )
    assert {t for _, t in page} == {LocalVideoFeedTier.TERRITORY_FALLBACK.value}


@pytest.mark.integration
@pytest.mark.asyncio
async def test_recency_orders_inside_a_tier(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    recente = await _video(session, auteur=a, quartier=q1, minutes=1)
    moyenne = await _video(session, auteur=a, quartier=q1, minutes=30)
    ancienne = await _video(session, auteur=a, quartier=q1, minutes=90)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    assert [v.id for v, _ in page] == [recente, moyenne, ancienne]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_equal_dates_are_broken_by_a_stable_identifier(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    petit = uuid.UUID("00000000-0000-4000-8000-000000000001")
    grand = uuid.UUID("ffffffff-0000-4000-8000-000000000001")
    await _video(session, auteur=a, quartier=q1, minutes=10, vid=petit)
    await _video(session, auteur=a, quartier=q1, minutes=10, vid=grand)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    # `id DESC` : le plus grand identifiant sort en premier, de facon reproductible.
    assert [v.id for v, _ in page] == [grand, petit]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_an_inactive_neighborhood_never_becomes_a_ranking_preference(
    session: AsyncSession,
) -> None:
    """Les trois secteurs fusionnes sont inactifs : leurs videos ne sortent pas."""
    actif = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    fusionne = await _quartier(
        session, slug="boulingrin", nom="Boulingrin", lat=_Q2[0], lon=_Q2[1], actif=False
    )
    a = await _auteur(session)
    await _video(session, auteur=a, quartier=fusionne, minutes=1)
    gardee = await _video(session, auteur=a, quartier=actif, minutes=50)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=actif
    )
    assert [v.id for v, _ in page] == [gardee]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_only_published_videos_reach_the_feed(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    for statut in ("processing", "failed", "pending"):
        await _video(session, auteur=a, quartier=q1, minutes=1, statut=statut)
    publiee = await _video(session, auteur=a, quartier=q1, minutes=20)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    assert [v.id for v, _ in page] == [publiee]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_another_city_is_excluded(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    await _video(session, auteur=a, quartier=q1, minutes=1, ville="Epernay")
    ici = await _video(session, auteur=a, quartier=q1, minutes=30)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    assert [v.id for v, _ in page] == [ici]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_an_inactive_author_is_excluded(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    inactif = await _auteur(session, actif=False)
    actif = await _auteur(session)
    await _video(session, auteur=inactif, quartier=q1, minutes=1)
    gardee = await _video(session, auteur=actif, quartier=q1, minutes=40)

    page = await LocalVideoRepository(session).list_published_feed(
        city=_VILLE, limit=10, viewer_neighborhood_id=q1
    )
    assert [v.id for v, _ in page] == [gardee]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_pagination_over_three_pages_has_no_duplicate_and_no_gap(
    session: AsyncSession,
) -> None:
    """Trois pages a cheval sur deux tiers : c'est la que le tier du curseur compte."""
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    q2 = await _quartier(session, slug="q2", nom="Quartier Deux", lat=_Q2[0], lon=_Q2[1])
    a = await _auteur(session)
    attendus: list[uuid.UUID] = []
    for i in range(3):  # tier 1 — quartier du spectateur
        attendus.append(await _video(session, auteur=a, quartier=q1, minutes=10 + i))
    for i in range(4):  # tier 2 — reste de la ville, VOLONTAIREMENT plus recent
        await _video(session, auteur=a, quartier=q2, minutes=1 + i)

    repo = LocalVideoRepository(session)
    vus: list[uuid.UUID] = []
    tiers: list[int] = []
    curseur: tuple[int, datetime, uuid.UUID] | None = None
    for _ in range(5):
        page = await repo.list_published_feed(
            city=_VILLE,
            limit=3,
            viewer_neighborhood_id=q1,
            cursor_tier=curseur[0] if curseur else None,
            cursor_published_at=curseur[1] if curseur else None,
            cursor_id=curseur[2] if curseur else None,
        )
        if not page:
            break
        for v, t in page:
            vus.append(v.id)
            tiers.append(t)
        dernier, dernier_tier = page[-1]
        assert dernier.published_at is not None
        curseur = (dernier_tier, dernier.published_at, dernier.id)

    assert len(vus) == 7, "aucune omission"
    assert len(set(vus)) == 7, "aucun doublon"
    assert tiers == sorted(tiers), "les tiers restent groupes et ordonnes"
    assert vus[:3] == attendus, "le quartier du spectateur sort en premier"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_last_page_is_empty_not_an_error(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    unique = await _video(session, auteur=a, quartier=q1, minutes=5)

    repo = LocalVideoRepository(session)
    page = await repo.list_published_feed(city=_VILLE, limit=10, viewer_neighborhood_id=q1)
    dernier, tier = page[-1]
    assert dernier.published_at is not None
    suivante = await repo.list_published_feed(
        city=_VILLE,
        limit=10,
        viewer_neighborhood_id=q1,
        cursor_tier=tier,
        cursor_published_at=dernier.published_at,
        cursor_id=unique,
    )
    assert suivante == []


@pytest.mark.integration
@pytest.mark.asyncio
async def test_coordinates_resolve_the_viewer_neighborhood(session: AsyncSession) -> None:
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    await _quartier(session, slug="q2", nom="Quartier Deux", lat=_Q2[0], lon=_Q2[1])

    resolu = await LocalVideoRepository(session).resolve_viewer_neighborhood(
        city=_VILLE,
        latitude=_Q1[0],
        longitude=_Q1[1],
        default_radius_meters=FEED_NEIGHBORHOOD_MATCH_RADIUS_METERS,
    )
    assert resolu is not None
    assert resolu[0] == q1
    assert resolu[1] == "Quartier Un"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_far_coordinates_resolve_to_no_neighborhood(session: AsyncSession) -> None:
    """Hors rayon : aucun quartier devine, donc aucun motif de quartier emis."""
    await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])

    resolu = await LocalVideoRepository(session).resolve_viewer_neighborhood(
        city=_VILLE,
        latitude=48.8566,  # Paris
        longitude=2.3522,
        default_radius_meters=FEED_NEIGHBORHOOD_MATCH_RADIUS_METERS,
    )
    assert resolu is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_an_inactive_neighborhood_is_never_resolved(session: AsyncSession) -> None:
    await _quartier(
        session, slug="boulingrin", nom="Boulingrin", lat=_Q1[0], lon=_Q1[1], actif=False
    )

    resolu = await LocalVideoRepository(session).resolve_viewer_neighborhood(
        city=_VILLE,
        latitude=_Q1[0],
        longitude=_Q1[1],
        default_radius_meters=FEED_NEIGHBORHOOD_MATCH_RADIUS_METERS,
    )
    assert resolu is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_page_costs_a_bounded_number_of_queries(session: AsyncSession) -> None:
    """Verrou anti-N+1 : le cout ne doit pas croitre avec le nombre de videos."""
    q1 = await _quartier(session, slug="q1", nom="Quartier Un", lat=_Q1[0], lon=_Q1[1])
    a = await _auteur(session)
    for i in range(12):
        await _video(session, auteur=a, quartier=q1, minutes=i + 1)
    await session.commit()

    requetes: list[str] = []

    def _tracer(state: object) -> None:  # pragma: no cover - compteur de test
        requetes.append("x")

    sa.event.listen(session.sync_session, "do_orm_execute", _tracer)
    try:
        page = await LocalVideoRepository(session).list_published_feed(
            city=_VILLE, limit=12, viewer_neighborhood_id=q1
        )
    finally:
        sa.event.remove(session.sync_session, "do_orm_execute", _tracer)

    assert len(page) == 12
    # 1 requete principale + les `selectinload` (auteur, profil, quartier, lieu,
    # evenement, tribu) : un nombre FIXE, sans rapport avec les 12 videos.
    assert len(requetes) <= 8, f"{len(requetes)} requetes — N+1 suspecte"
