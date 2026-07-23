"""QUARTIER-01 phase 3d — contenu editorial des 9 quartiers reutilises.

Deux invariants sous test :
1. Les 10 champs 3d (official_label, ambiance, short_description, long_story + 6 colonnes 3a)
   sont bien appliques aux 9 quartiers reutilises, et PAS aux 3 fusionnes.
2. Point 4 du ticket : appliquer le contenu 3d ne detruit ni les moods, ni la timeline, ni les
   aliases deja poses par le seed editorial. Le test compare la DB au tuple source, donc il
   echoue si l'override 3d ecrasait ces tables (ex. override deplace avant les INSERT).
"""

from __future__ import annotations

from typing import Any

import pytest
from app.core.config import Settings
from app.core.neighborhood_v2_constants import (
    MVP_NEIGHBORHOOD_MOODS,
    NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT,
)
from app.db.seeds.reims_neighborhoods_3d_content import (
    EDITORIAL_3D_FIELDS,
    REIMS_NEIGHBORHOOD_3D_CONTENT,
)
from app.db.seeds.reims_neighborhoods_catalog import (
    REIMS_MERGED_NEIGHBORHOOD_SLUGS,
    seed_reims_neighborhoods_catalog,
)
from app.db.seeds.reims_neighborhoods_v2_editorial import (
    _DEFAULT_TIMELINE,
    REIMS_NEIGHBORHOOD_V2_EDITORIAL,
)
from app.db.session import get_engine
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodAlias,
    NeighborhoodMoodAssignment,
    NeighborhoodTimelineEntry,
)
from httpx import AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

# Les 6 colonnes texte ajoutees en 3a : peuplees en 3d pour les 9 reutilises, jamais les fusionnes.
_NEW_3A_COLUMNS = (
    "audience",
    "neighborhood_type",
    "local_life",
    "green_spaces",
    "mobility",
    "daily_life",
)

def _prod_settings() -> Settings:
    # Construit dans le corps des tests (jamais au niveau module) : en prod, Settings exige
    # DATABASE_URL, lu depuis l'env. Le job CI lint tourne sans DATABASE_URL et les tests
    # d'integration sont skippes par auth_client — construire ici evite de casser la collection.
    return Settings(
        APP_ENV="prod",
        DEBUG=False,
        JWT_SECRET_KEY="x" * 48,
        REFRESH_TOKEN_PEPPER="y" * 32,
        REFRESH_COOKIE_SECURE=True,
        WEB_FRONTEND_URL="https://yunicity.city",
        CORS_ORIGINS=["https://yunicity.city"],
        MEDIA_PUBLIC_BASE_URL="https://api.yunicity.city",
        EMAIL_PROVIDER="console",
    )


def _editorial_entry(slug: str) -> dict[str, Any]:
    for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL:
        if row["slug"] == slug:
            return row
    raise AssertionError(f"slug {slug!r} absent du tuple editorial v2")


def _expected_moods(slug: str) -> list[str]:
    # Le seed filtre les moods hors MVP : l'attendu DB doit appliquer le meme filtre.
    return [m for m in _editorial_entry(slug).get("moods", ()) if m in MVP_NEIGHBORHOOD_MOODS]


def _expected_aliases(slug: str) -> list[str]:
    return [a["alias"] for a in _editorial_entry(slug).get("aliases", ())]


def _expected_timeline_years(slug: str) -> list[int]:
    # Meme fallback que _apply_editorial_row : timeline explicite, sinon _DEFAULT_TIMELINE.
    rows = _editorial_entry(slug).get("timeline", _DEFAULT_TIMELINE)
    return [t["year"] for t in rows]


async def _seed_fresh(session: AsyncSession) -> None:
    await session.execute(delete(Neighborhood))
    await session.flush()
    await seed_reims_neighborhoods_catalog(session, _prod_settings())
    await session.commit()


async def _hood(session: AsyncSession, slug: str) -> Neighborhood:
    hood = (
        await session.execute(select(Neighborhood).where(Neighborhood.slug == slug))
    ).scalar_one()
    return hood


def test_3d_content_module_is_self_consistent() -> None:
    """Garde-fous import + cadrage : 9 slugs, aucun fusionne, tous connus du tuple editorial."""
    assert len(REIMS_NEIGHBORHOOD_3D_CONTENT) == 9
    assert set(REIMS_NEIGHBORHOOD_3D_CONTENT) & set(REIMS_MERGED_NEIGHBORHOOD_SLUGS) == set()
    editorial_slugs = {row["slug"] for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL}
    # Chaque quartier 3d doit passer par _apply_editorial_row, donc etre dans le tuple.
    assert set(REIMS_NEIGHBORHOOD_3D_CONTENT) <= editorial_slugs


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3d_fields_applied_to_reused_neighborhoods(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await _seed_fresh(session)

    async with factory() as session:
        for slug, content in REIMS_NEIGHBORHOOD_3D_CONTENT.items():
            hood = await _hood(session, slug)
            for field in EDITORIAL_3D_FIELDS:
                expected = content.get(field)  # None quand absent (ex. official_label)
                actual = getattr(hood, field)
                assert actual == expected, f"{slug}.{field}: {actual!r} != {expected!r}"
            # Les 6 colonnes 3a doivent etre effectivement peuplees (non-null) sur les 9.
            for col in _NEW_3A_COLUMNS:
                assert getattr(hood, col), f"{slug}.{col} vide"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3d_preserves_moods_timeline_aliases(auth_client: AsyncClient) -> None:
    """Point 4 : l'override 3d ne doit rien retirer aux moods / timeline / aliases."""
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await _seed_fresh(session)

    # centre-ville : quartier 3d (long_story/short_description reecrits) avec 2 aliases, 3 moods,
    # 3 entrees de timeline dans le tuple -> sujet ideal pour prouver la non-regression.
    slug = "centre-ville"
    entry = _editorial_entry(slug)
    async with factory() as session:
        hood = await _hood(session, slug)

        moods = (
            (
                await session.execute(
                    select(NeighborhoodMoodAssignment.mood_slug)
                    .where(NeighborhoodMoodAssignment.neighborhood_id == hood.id)
                    .order_by(NeighborhoodMoodAssignment.sort_order)
                )
            )
            .scalars()
            .all()
        )
        aliases = (
            (
                await session.execute(
                    select(NeighborhoodAlias.alias)
                    .where(NeighborhoodAlias.neighborhood_id == hood.id)
                    .order_by(NeighborhoodAlias.sort_order)
                )
            )
            .scalars()
            .all()
        )
        timeline_years = (
            (
                await session.execute(
                    select(NeighborhoodTimelineEntry.year)
                    .where(NeighborhoodTimelineEntry.neighborhood_id == hood.id)
                    .order_by(NeighborhoodTimelineEntry.sort_order)
                )
            )
            .scalars()
            .all()
        )

    assert list(moods) == _expected_moods(slug)
    assert list(aliases) == _expected_aliases(slug)
    assert list(timeline_years) == _expected_timeline_years(slug)
    # Et le contenu 3d a bien ete applique par-dessus (long_story reecrit, pas celui du tuple).
    assert hood.long_story == REIMS_NEIGHBORHOOD_3D_CONTENT[slug]["long_story"]
    assert hood.long_story != entry["long_story"]


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3d_not_applied_to_merged_neighborhoods(auth_client: AsyncClient) -> None:
    """Les 3 fusionnes n'ont pas d'entree 3d -> aucune colonne 3d, long_story du tuple conserve."""
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await _seed_fresh(session)

    async with factory() as session:
        for slug in REIMS_MERGED_NEIGHBORHOOD_SLUGS:
            hood = await _hood(session, slug)
            # 3d ne les touche pas -> official_label reste le placeholder du seed de base,
            # et les 6 colonnes 3a restent non peuplees.
            assert hood.official_label == NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT
            for col in _NEW_3A_COLUMNS:
                assert getattr(hood, col) is None, f"{slug}.{col} ne doit pas etre pose en 3d"
            # long_story reste celui du tuple editorial (non reecrit par 3d).
            assert hood.long_story == _editorial_entry(slug)["long_story"]


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3d_idempotent(auth_client: AsyncClient) -> None:
    """Reseeder ne fait pas deriver les champs 3d ni accumuler moods / timeline / aliases."""
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    slug = "chemin-vert"
    async with factory() as session:
        await _seed_fresh(session)
        # Deuxieme passe complete du catalog dans la meme base.
        await seed_reims_neighborhoods_catalog(session, _prod_settings())
        await session.commit()

    async with factory() as session:
        hood = await _hood(session, slug)
        content = REIMS_NEIGHBORHOOD_3D_CONTENT[slug]
        assert hood.official_label == content["official_label"]
        assert hood.ambiance == content["ambiance"]
        assert hood.neighborhood_type == content["neighborhood_type"]

        for model in (NeighborhoodMoodAssignment, NeighborhoodAlias, NeighborhoodTimelineEntry):
            count = (
                await session.execute(
                    select(func.count()).select_from(model).where(model.neighborhood_id == hood.id)
                )
            ).scalar_one()
            expected = {
                NeighborhoodMoodAssignment: len(_expected_moods(slug)),
                NeighborhoodAlias: len(_expected_aliases(slug)),
                NeighborhoodTimelineEntry: len(_expected_timeline_years(slug)),
            }[model]
            assert count == expected, f"{model.__tablename__}: {count} != {expected}"
