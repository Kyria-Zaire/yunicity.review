"""Tags communautes des quartiers de Reims (QUARTIER-01 phase 3e).

Les tags communautes calquent les mood_tags : un catalogue (slug + label) plus des assignments
ordonnes par quartier. A la lecture (3f), un tag alimente une recherche de tribus PAR CATEGORIE
(cf. docstring migration 20260719_0058) — d'ou des slugs alignes sur le vocabulaire des
categories yunicity (reims_signed_partners / yunicity_categories). Un tag qui ne correspond a
aucune categorie resoudrait silencieusement zero tribu : l'alignement est verifie en test.

Portee 3e : seuls les 3 quartiers crees recoivent des tags ici. Les 12 quartiers d'origine
restent sans tag communaute pour l'instant (lot ulterieur).
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.neighborhood import Neighborhood
from app.models.neighborhood_editorial import (
    NeighborhoodCommunityTag,
    NeighborhoodCommunityTagAssignment,
)

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

# slug (= slug de categorie yunicity) -> label affiche.
NEIGHBORHOOD_COMMUNITY_TAG_LABELS: dict[str, str] = {
    "association": "Association",
    "sport": "Sport",
    "famille": "Famille",
    "commerce": "Commerce",
    "sante": "Santé",
    "restaurant": "Restaurant",
}

# quartier -> tags ordonnes. Derives du contenu Founder (chatillons : vie associative, sport,
# familles ; courlancy : sport, sante, familles ; cernay-jj : commerces, restauration, familles).
REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS: dict[str, tuple[str, ...]] = {
    "chatillons": ("association", "sport", "famille"),
    "courlancy": ("sport", "sante", "famille"),
    "cernay-jean-jaures": ("commerce", "restaurant", "famille"),
}


async def _ensure_community_tags(session: AsyncSession) -> None:
    for slug, label in NEIGHBORHOOD_COMMUNITY_TAG_LABELS.items():
        existing = await session.get(NeighborhoodCommunityTag, slug)
        if existing is None:
            session.add(NeighborhoodCommunityTag(slug=slug, label=label))
        elif existing.label != label:
            existing.label = label
    await session.flush()


async def _neighborhood_id(session: AsyncSession, slug: str) -> uuid.UUID | None:
    return (
        await session.execute(
            select(Neighborhood.id).where(
                Neighborhood.city == REIMS_CITY,
                Neighborhood.slug == slug,
            )
        )
    ).scalar_one_or_none()


async def seed_reims_neighborhood_community_tags(session: AsyncSession) -> int:
    """Idempotent : upsert du catalogue, puis DELETE+INSERT des assignments par quartier.

    Retourne le nombre d'assignments ecrits.
    """
    await _ensure_community_tags(session)

    assigned = 0
    for slug, tags in REIMS_NEIGHBORHOOD_COMMUNITY_TAG_ASSIGNMENTS.items():
        hood_id = await _neighborhood_id(session, slug)
        if hood_id is None:
            logger.warning("neighborhood_community_tags_skip_missing slug=%s", slug)
            continue
        await session.execute(
            delete(NeighborhoodCommunityTagAssignment).where(
                NeighborhoodCommunityTagAssignment.neighborhood_id == hood_id
            )
        )
        for sort_order, tag_slug in enumerate(tags):
            session.add(
                NeighborhoodCommunityTagAssignment(
                    id=uuid.uuid4(),
                    neighborhood_id=hood_id,
                    tag_slug=tag_slug,
                    sort_order=sort_order,
                )
            )
            assigned += 1

    await session.flush()
    logger.info("reims_neighborhood_community_tags_seed_completed count=%s", assigned)
    return assigned
