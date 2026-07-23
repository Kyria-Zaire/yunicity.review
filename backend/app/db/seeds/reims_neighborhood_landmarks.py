"""Landmarks des quartiers de Reims (QUARTIER-01 phase 3e).

Table de liaison neighborhood_landmarks -> cultural_places : lieux emblematiques cures et
ordonnes par quartier (cf. docstring migration 20260719_0058). A cabler APRES le seed des
cultural_places (les slugs references sont des lieux officiels), donc dans le catalog
cultural-places, pas dans le catalog neighborhoods.

Portee 3e : seuls les 3 quartiers crees. chatillons n'a aucun cultural_place source (Place des
Argonautes / Parc des Chatillons absents du catalogue) -> aucun landmark (decision 3e, Founder).
Les incontournables des 9 quartiers reutilises restent a cabler dans un lot ulterieur.

Garde-fou : un slug de lieu reference mais absent leve une RuntimeError (lien casse = bug de
configuration, pas donnee silencieusement manquante). Les 4 lieux ici sont officiels, donc
garantis presents apres seed_reims_cultural_places_catalog.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cultural_place import CulturalPlace
from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import NeighborhoodLandmark

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

# quartier -> lieux emblematiques ordonnes (slugs de cultural_places officiels de Reims).
REIMS_NEIGHBORHOOD_LANDMARKS: dict[str, tuple[str, ...]] = {
    "courlancy": ("porte-de-paris", "stade-auguste-delaune"),
    "cernay-jean-jaures": ("halles-boulingrin", "eglise-saint-andre"),
}


async def _place_ids_by_slug(session: AsyncSession, slugs: set[str]) -> dict[str, uuid.UUID]:
    rows = (
        await session.execute(
            select(CulturalPlace.slug, CulturalPlace.id).where(
                CulturalPlace.city == REIMS_CITY,
                CulturalPlace.slug.in_(slugs),
            )
        )
    ).all()
    return {slug: place_id for slug, place_id in rows}


async def _neighborhood_id(session: AsyncSession, slug: str) -> uuid.UUID | None:
    return (
        await session.execute(
            select(Neighborhood.id).where(
                Neighborhood.city == REIMS_CITY,
                Neighborhood.slug == slug,
            )
        )
    ).scalar_one_or_none()


async def seed_reims_neighborhood_landmarks(session: AsyncSession) -> int:
    """Idempotent : DELETE+INSERT des landmarks par quartier. Retourne le nombre de liens.

    Leve RuntimeError si un cultural_place reference est absent (lien casse).
    """
    referenced = {slug for slugs in REIMS_NEIGHBORHOOD_LANDMARKS.values() for slug in slugs}
    place_ids = await _place_ids_by_slug(session, referenced)
    missing = sorted(referenced - set(place_ids))
    if missing:
        raise RuntimeError(
            f"Reims neighborhood landmarks reference des cultural_places absents : {missing}. "
            "Seeder d'abord --cultural-places."
        )

    linked = 0
    for slug, place_slugs in REIMS_NEIGHBORHOOD_LANDMARKS.items():
        hood_id = await _neighborhood_id(session, slug)
        if hood_id is None:
            logger.warning("neighborhood_landmarks_skip_missing_neighborhood slug=%s", slug)
            continue
        await session.execute(
            delete(NeighborhoodLandmark).where(NeighborhoodLandmark.neighborhood_id == hood_id)
        )
        for sort_order, place_slug in enumerate(place_slugs):
            session.add(
                NeighborhoodLandmark(
                    id=uuid.uuid4(),
                    neighborhood_id=hood_id,
                    cultural_place_id=place_ids[place_slug],
                    sort_order=sort_order,
                )
            )
            linked += 1

    await session.flush()
    logger.info("reims_neighborhood_landmarks_seed_completed count=%s", linked)
    return linked
