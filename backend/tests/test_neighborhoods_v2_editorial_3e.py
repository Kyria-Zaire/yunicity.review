"""QUARTIER-01 phase 3e — contenu des 3 quartiers crees + tags communautes + landmarks.

Invariants sous test :
- Editorial 3e applique aux 3 crees (official_label, ambiance, short_description + 6 colonnes),
  long_story pose via le tuple v2.
- Tags communautes assignes et ORDONNES ; leur vocabulaire est aligne sur les categories
  (un tag hors categorie resoudrait zero tribu en silence -> invariant explicite).
- Landmarks lies aux cultural_places officiels ; chatillons n'en a aucun ; un lieu reference
  absent fait LEVER le seed (garde-fou bruyant, pas de lien silencieusement manquant).
- Idempotence : reseeder ne fait pas deriver le contenu ni accumuler tags / landmarks.

Settings construit dans le corps des tests (jamais au niveau module) : cf. lecon 3d, le job CI
lint tourne sans DATABASE_URL et casserait la collection sinon.
"""

from __future__ import annotations

import pytest
from app.core.config import Settings
from app.core.cultural_place_assets import REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS
from app.db.seeds.reims_cultural_places_catalog import seed_reims_cultural_places_catalog
from app.db.seeds.reims_neighborhood_community_tags import (
    NEIGHBORHOOD_COMMUNITY_TAG_LABELS,
    REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS,
)
from app.db.seeds.reims_neighborhood_landmarks import (
    REIMS_NEIGHBORHOOD_LANDMARKS,
    seed_reims_neighborhood_landmarks,
)
from app.db.seeds.reims_neighborhoods_3d_content import REIMS_NEIGHBORHOOD_3D_CONTENT
from app.db.seeds.reims_neighborhoods_3e_content import REIMS_NEIGHBORHOOD_3E_CONTENT
from app.db.seeds.reims_neighborhoods_catalog import (
    REIMS_MERGED_NEIGHBORHOOD_SLUGS,
    seed_reims_neighborhoods_catalog,
)
from app.db.seeds.reims_neighborhoods_v2_editorial import REIMS_NEIGHBORHOOD_V2_EDITORIAL
from app.db.seeds.yunicity_categories import YUNICITY_CATEGORY_SEED
from app.db.session import get_engine
from app.models.cultural_place import CulturalPlace
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodCommunityTagAssignment,
    NeighborhoodLandmark,
)
from httpx import AsyncClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

_NEW_SLUGS = ("cernay-jean-jaures", "courlancy", "chatillons")
_NEW_3A_COLUMNS = (
    "audience",
    "neighborhood_type",
    "local_life",
    "green_spaces",
    "mobility",
    "daily_life",
)


def _prod_settings() -> Settings:
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


async def _seed_full(session: AsyncSession) -> None:
    """Etat frais complet : quartiers (+ tags) puis lieux (+ landmarks)."""
    await session.execute(delete(CulturalPlace))  # cascade landmarks
    await session.execute(delete(Neighborhood))  # cascade tags / editorial / landmarks
    await session.flush()
    await seed_reims_neighborhoods_catalog(session, _prod_settings())
    await seed_reims_cultural_places_catalog(session, _prod_settings())
    await session.commit()


async def _hood(session: AsyncSession, slug: str) -> Neighborhood:
    return (
        await session.execute(select(Neighborhood).where(Neighborhood.slug == slug))
    ).scalar_one()


# --- Invariants purs (sans DB) ---


def test_3e_content_module_is_self_consistent() -> None:
    assert set(REIMS_NEIGHBORHOOD_3E_CONTENT) == set(_NEW_SLUGS)
    # Disjoint de 3d et des fusionnes ; tous connus du tuple editorial (sinon jamais appliques).
    assert set(REIMS_NEIGHBORHOOD_3E_CONTENT).isdisjoint(REIMS_NEIGHBORHOOD_3D_CONTENT)
    assert set(REIMS_NEIGHBORHOOD_3E_CONTENT).isdisjoint(REIMS_MERGED_NEIGHBORHOOD_SLUGS)
    editorial_slugs = {row["slug"] for row in REIMS_NEIGHBORHOOD_V2_EDITORIAL}
    assert set(REIMS_NEIGHBORHOOD_3E_CONTENT) <= editorial_slugs


def test_community_tags_align_with_categories() -> None:
    """Un tag hors vocabulaire categories resoudrait zero tribu en silence (3f)."""
    category_slugs = {c["slug"] for c in YUNICITY_CATEGORY_SEED}
    used = {tag for tags in REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS.values() for tag in tags}
    assert used <= category_slugs, f"tags hors categories : {sorted(used - category_slugs)}"
    # Tout tag assigne doit exister dans le catalogue (label defini).
    assert used <= set(NEIGHBORHOOD_COMMUNITY_TAG_LABELS)


def test_landmark_places_are_official() -> None:
    """Les lieux landmark doivent etre officiels, donc seedes par le catalog cultural-places."""
    referenced = {slug for slugs in REIMS_NEIGHBORHOOD_LANDMARKS.values() for slug in slugs}
    assert referenced <= set(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS)
    # chatillons n'a pas de landmark (aucun cultural_place source).
    assert "chatillons" not in REIMS_NEIGHBORHOOD_LANDMARKS


# --- Integration (vrai Postgres) ---


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3e_editorial_applied_to_new_neighborhoods(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_full(session)
    async with factory() as session:
        for slug, content in REIMS_NEIGHBORHOOD_3E_CONTENT.items():
            hood = await _hood(session, slug)
            for field, expected in content.items():
                assert getattr(hood, field) == expected, f"{slug}.{field}"
            for col in _NEW_3A_COLUMNS:
                assert getattr(hood, col), f"{slug}.{col} vide"
            # long_story vient du tuple v2 (pas du module 3e) : present et non vide.
            assert hood.long_story


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3e_community_tags_assigned(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_full(session)
    async with factory() as session:
        for slug, expected in REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS.items():
            hood = await _hood(session, slug)
            tags = (
                (
                    await session.execute(
                        select(NeighborhoodCommunityTagAssignment.tag_slug)
                        .where(NeighborhoodCommunityTagAssignment.neighborhood_id == hood.id)
                        .order_by(NeighborhoodCommunityTagAssignment.sort_order)
                    )
                )
                .scalars()
                .all()
            )
            assert list(tags) == list(expected), f"{slug}: {list(tags)} != {list(expected)}"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3e_landmarks_linked(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_full(session)
    async with factory() as session:
        for slug, expected in REIMS_NEIGHBORHOOD_LANDMARKS.items():
            hood = await _hood(session, slug)
            places = (
                (
                    await session.execute(
                        select(CulturalPlace.slug)
                        .join(
                            NeighborhoodLandmark,
                            NeighborhoodLandmark.cultural_place_id == CulturalPlace.id,
                        )
                        .where(NeighborhoodLandmark.neighborhood_id == hood.id)
                        .order_by(NeighborhoodLandmark.sort_order)
                    )
                )
                .scalars()
                .all()
            )
            assert list(places) == list(expected), f"{slug}: {list(places)} != {list(expected)}"
        # chatillons : aucun landmark.
        chatillons = await _hood(session, "chatillons")
        count = (
            await session.execute(
                select(func.count())
                .select_from(NeighborhoodLandmark)
                .where(NeighborhoodLandmark.neighborhood_id == chatillons.id)
            )
        ).scalar_one()
        assert count == 0


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3e_landmark_seed_raises_when_place_missing(auth_client: AsyncClient) -> None:
    """Garde-fou bruyant : un lieu landmark absent leve, pas de lien silencieusement manquant."""
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        # Quartiers presents (fixture auth_client), mais aucun cultural_place.
        await session.execute(delete(CulturalPlace))
        await session.flush()
        with pytest.raises(RuntimeError, match="cultural_places absents"):
            await seed_reims_neighborhood_landmarks(session)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_3e_idempotent(auth_client: AsyncClient) -> None:
    _ = auth_client
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await _seed_full(session)
        # Deuxieme passe complete des deux catalogs.
        second_hoods = await seed_reims_neighborhoods_catalog(session, _prod_settings())
        second_places = await seed_reims_cultural_places_catalog(session, _prod_settings())
        await session.commit()

    expected_tags = sum(len(t) for t in REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS.values())
    expected_landmarks = sum(len(p) for p in REIMS_NEIGHBORHOOD_LANDMARKS.values())
    assert second_hoods.community_tags_assigned == expected_tags
    assert second_places.landmarks_linked == expected_landmarks

    async with factory() as session:
        # Pas d'accumulation : totaux en base = attendus.
        tag_count = (
            await session.execute(
                select(func.count()).select_from(NeighborhoodCommunityTagAssignment)
            )
        ).scalar_one()
        landmark_count = (
            await session.execute(select(func.count()).select_from(NeighborhoodLandmark))
        ).scalar_one()
    assert tag_count == expected_tags
    assert landmark_count == expected_landmarks
