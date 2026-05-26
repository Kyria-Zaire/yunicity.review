"""Reims emblematic cultural places seed (WEB-MAP-03)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cultural_place import CulturalPlace
from app.models.neighborhood import Neighborhood

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

# Coordonnées de référence : open data / géolocalisation publique (DATAtourisme, IGN).
# Images : droits non validés en MVP → image_url null, placeholder côté frontend.
_SOURCE = "Catalogue éditorial Yunicity — coordonnées publiques"
_SOURCE_URL = "https://www.datatourisme.fr/"

REIMS_CULTURAL_PLACES_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000001"),
        "slug": "cathedrale-notre-dame",
        "name": "Cathédrale Notre-Dame de Reims",
        "short_description": "Chef-d’œuvre gothique et lieu de sacre des rois de France.",
        "description": (
            "Monument emblématique de Reims, classé au patrimoine mondial. "
            "Point de départ idéal pour découvrir le centre historique."
        ),
        "address": "Place du Cardinal Luçon",
        "latitude": 49.2538,
        "longitude": 4.0340,
        "category": "cathedral",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000002"),
        "slug": "palais-du-tau",
        "name": "Palais du Tau",
        "short_description": "Ancienne résidence des archevêques, face à la cathédrale.",
        "description": "Musée et architecture médiévale au cœur du parcours royal de Reims.",
        "address": "2 Place du Cardinal Luçon",
        "latitude": 49.2536,
        "longitude": 4.0348,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000003"),
        "slug": "basilique-saint-remi",
        "name": "Basilique Saint-Remi",
        "short_description": "Basilique romane et nécropole royale, quartier Saint-Remi.",
        "description": "Un des plus grands édifices religieux de style roman en France.",
        "address": "1 Rue Simon",
        "latitude": 49.2434,
        "longitude": 4.0392,
        "category": "heritage",
        "neighborhood_slug": "saint-remi",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000004"),
        "slug": "musee-saint-remi",
        "name": "Musée Saint-Remi",
        "short_description": "Collections archéologiques et histoire de Reims.",
        "description": (
            "Installé dans l’ancienne abbaye, complément naturel de la basilique voisine."
        ),
        "address": "53 Rue Simon",
        "latitude": 49.2436,
        "longitude": 4.0414,
        "category": "museum",
        "neighborhood_slug": "saint-remi",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000005"),
        "slug": "porte-de-mars",
        "name": "Porte de Mars",
        "short_description": "Arc de triomphe gallo-romain au centre-ville.",
        "description": "Monument antique parmi les mieux conservés du nord de la Gaule.",
        "address": "Place de la République",
        "latitude": 49.2573,
        "longitude": 4.0311,
        "category": "monument",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000006"),
        "slug": "halles-boulingrin",
        "name": "Halles du Boulingrin",
        "short_description": "Marché couvert et architecture des années 1920.",
        "description": "Lieu de vie locale, marché et événements autour du Boulingrin.",
        "address": "34 Rue de Mars",
        "latitude": 49.2598,
        "longitude": 4.0275,
        "category": "market",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000007"),
        "slug": "place-royale",
        "name": "Place Royale",
        "short_description": "Place classique au cœur du centre, commerces et terrasses.",
        "description": "Perspective ordonnée typique du XVIIIe siècle, proche de la cathédrale.",
        "address": "Place Royale",
        "latitude": 49.2602,
        "longitude": 4.0298,
        "category": "square",
        "neighborhood_slug": "centre-ville",
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000008"),
        "slug": "place-erlon",
        "name": "Place d’Erlon",
        "short_description": "Artère commerçante et animée du centre de Reims.",
        "description": "Grande perspective urbaine entre gare et centre historique.",
        "address": "Place Drouet d’Erlon",
        "latitude": 49.2555,
        "longitude": 4.0258,
        "category": "square",
        "neighborhood_slug": "centre-ville",
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000009"),
        "slug": "bibliotheque-carnegie",
        "name": "Bibliothèque Carnegie",
        "short_description": "Bibliothèque patrimoniale offerte par Andrew Carnegie.",
        "description": "Architecture éclectique et salon de lecture remarquable.",
        "address": "2 Place Carnegie",
        "latitude": 49.2456,
        "longitude": 4.0434,
        "category": "library",
        "neighborhood_slug": "saint-remi",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000010"),
        "slug": "villa-demoiselle",
        "name": "Villa Demoiselle",
        "short_description": "Villa Art nouveau et jardins, colline de Reims.",
        "description": "Demeure historique liée au patrimoine marnais de la ville.",
        "address": "56 Avenue du Général Giraud",
        "latitude": 49.2417,
        "longitude": 4.0470,
        "category": "heritage",
        "neighborhood_slug": "saint-remi",
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000011"),
        "slug": "domaine-pommery",
        "name": "Domaine Pommery",
        "short_description": "Maison de champagne et crayères classées.",
        "description": "Visites des caves et architecture industrielle emblématique.",
        "address": "5 Place du Général Gouraud",
        "latitude": 49.2422,
        "longitude": 4.0582,
        "category": "winery",
        "neighborhood_slug": "saint-remi",
        "is_featured": True,
    },
)


async def _neighborhood_ids_by_slug(session: AsyncSession, city: str) -> dict[str, uuid.UUID]:
    result = await session.execute(
        select(Neighborhood.slug, Neighborhood.id).where(Neighborhood.city == city)
    )
    return {slug: row_id for slug, row_id in result.all()}


async def seed_reims_cultural_places(session: AsyncSession) -> None:
    hood_ids = await _neighborhood_ids_by_slug(session, REIMS_CITY)
    for entry in REIMS_CULTURAL_PLACES_SEED:
        hood_slug = entry.get("neighborhood_slug")
        neighborhood_id = hood_ids.get(hood_slug) if isinstance(hood_slug, str) else None
        row = CulturalPlace(
            id=entry["id"],
            slug=entry["slug"],
            name=entry["name"],
            short_description=entry["short_description"],
            description=entry.get("description"),
            city=REIMS_CITY,
            neighborhood_id=neighborhood_id,
            address=entry["address"],
            latitude=entry["latitude"],
            longitude=entry["longitude"],
            category=entry["category"],
            image_url=None,
            image_alt=None,
            source_name=_SOURCE,
            source_url=_SOURCE_URL,
            image_credit=None,
            image_license=None,
            is_featured=bool(entry.get("is_featured", False)),
            is_active=True,
        )
        repo_row = await session.get(CulturalPlace, row.id)
        if repo_row is None:
            existing = await session.execute(
                select(CulturalPlace).where(
                    CulturalPlace.city == REIMS_CITY,
                    CulturalPlace.slug == row.slug,
                )
            )
            found = existing.scalar_one_or_none()
            if found is None:
                session.add(row)
            else:
                for field in (
                    "name",
                    "short_description",
                    "description",
                    "neighborhood_id",
                    "address",
                    "latitude",
                    "longitude",
                    "category",
                    "source_name",
                    "source_url",
                    "is_featured",
                    "is_active",
                ):
                    setattr(found, field, getattr(row, field))
        else:
            for field in (
                "name",
                "short_description",
                "description",
                "neighborhood_id",
                "address",
                "latitude",
                "longitude",
                "category",
                "source_name",
                "source_url",
                "is_featured",
                "is_active",
            ):
                setattr(repo_row, field, getattr(row, field))
    logger.info("reims_cultural_places_seed_completed count=%s", len(REIMS_CULTURAL_PLACES_SEED))
