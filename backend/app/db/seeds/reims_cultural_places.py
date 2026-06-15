"""Reims emblematic cultural places seed (WEB-MAP-03, WEB-SEARCH-02B.1)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.cultural_place_assets import (
    REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS,
    cultural_place_seed_cover_url,
)
from app.db.seeds.reims_cultural_media import REIMS_CULTURAL_MEDIA_BY_SLUG
from app.models.cultural_place import CulturalPlace
from app.models.neighborhood import Neighborhood
from app.services.cultural_media import normalize_cultural_media

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

_SOURCE = "Catalogue éditorial Yunicity — médias Wikimedia Commons"
_SOURCE_URL = "https://commons.wikimedia.org/"
_PROD_SOURCE = "Catalogue éditorial Yunicity"

_OFFICIAL_FEATURED_SLUGS = frozenset(
    {
        "cathedrale-notre-dame",
        "palais-du-tau",
        "basilique-saint-remi",
        "musee-des-beaux-arts",
        "opera-de-reims",
        "frac-grand-est",
    }
)

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
        "neighborhood_slug": "boulingrin",
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
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000012"),
        "slug": "opera-de-reims",
        "name": "Opéra de Reims",
        "short_description": "Scène nationale et façade néoclassique sur la place du Forum.",
        "description": "Programmation vivante au cœur du centre historique.",
        "address": "1 Place du Forum",
        "latitude": 49.2545,
        "longitude": 4.0289,
        "category": "theatre",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000013"),
        "slug": "parc-de-champagne",
        "name": "Parc de Champagne",
        "short_description": "Grand parc urbain au sud de Reims, verdure et panoramas.",
        "description": "Promenades, jardins et vue sur la ville depuis les hauteurs.",
        "address": "Avenue du Général Giraud",
        "latitude": 49.2385,
        "longitude": 4.0510,
        "category": "park",
        "neighborhood_slug": "saint-remi",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000014"),
        "slug": "musee-des-beaux-arts",
        "name": "Musée des Beaux-Arts",
        "short_description": "Collections des XVe au XXIe siècles dans un palais du XVIIIe.",
        "description": "Peintures, sculptures et arts décoratifs au cœur de Reims.",
        "address": "8 Rue Chanzy",
        "latitude": 49.2581,
        "longitude": 4.0318,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000015"),
        "slug": "cryptoportique",
        "name": "Cryptoportique",
        "short_description": "Galerie gallo-romaine sous la place du Forum.",
        "description": "Mémoire souterraine de Durocortorum, accessible au public.",
        "address": "Place du Forum",
        "latitude": 49.2542,
        "longitude": 4.0282,
        "category": "heritage",
        "neighborhood_slug": "centre-ville",
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000016"),
        "slug": "planetarium-de-reims",
        "name": "Planétarium de Reims",
        "short_description": "Découverte des étoiles et des sciences au cœur de Reims.",
        "description": (
            "Espace de médiation scientifique pour les familles et les curieux du ciel."
        ),
        "address": "49 Rue du Général Ponty",
        "latitude": 49.2342,
        "longitude": 4.0215,
        "category": "museum",
        "neighborhood_slug": "murigny",
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6030000-0000-4000-8000-000000000017"),
        "slug": "frac-grand-est",
        "name": "FRAC Champagne-Ardenne",
        "short_description": "Art contemporain et expositions au Frac Grand Est à Reims.",
        "description": (
            "Institution d'art contemporain, vitrine culturelle de la région Grand Est."
        ),
        "address": "1 Square Aly Nabarro",
        "latitude": 49.2612,
        "longitude": 4.0356,
        "category": "museum",
        "neighborhood_slug": "centre-ville",
        "is_featured": True,
    },
)

_MEDIA_SYNC_FIELDS = (
    "name",
    "short_description",
    "description",
    "neighborhood_id",
    "address",
    "latitude",
    "longitude",
    "category",
    "image_url",
    "hero_image_url",
    "gallery_images",
    "thumbnail_image_url",
    "image_alt",
    "source_name",
    "source_url",
    "photo_credit",
    "image_credit",
    "image_source",
    "image_license",
    "editorial_excerpt",
    "image_blurhash",
    "featured_priority",
    "is_featured",
    "is_active",
)


async def _neighborhood_ids_by_slug(session: AsyncSession, city: str) -> dict[str, uuid.UUID]:
    result = await session.execute(
        select(Neighborhood.slug, Neighborhood.id).where(Neighborhood.city == city)
    )
    return {slug: row_id for slug, row_id in result.all()}


def _prod_media_for_place(entry: dict[str, Any], settings: Settings) -> dict[str, Any]:
    slug = str(entry["slug"])
    cover = cultural_place_seed_cover_url(
        slug,
        app_env=settings.app_env,
        web_frontend_url=settings.web_frontend_url,
    )
    alt = f"{entry['name']} — Reims"
    featured = bool(entry.get("is_featured", slug in _OFFICIAL_FEATURED_SLUGS))
    priority = 100 if slug == "cathedrale-notre-dame" else (80 if featured else 10)
    return {
        "hero_image_url": cover,
        "thumbnail_image_url": cover,
        "image_source": "yunicity_asset",
        "photo_credit": "Yunicity",
        "image_credit": "Yunicity",
        "gallery_images": [
            {"url": cover, "alt": alt, "credit": "Yunicity", "source": "yunicity_asset"},
        ],
        "featured_priority": priority,
        "is_featured": featured,
    }


def _build_place_row(
    entry: dict[str, Any],
    *,
    neighborhood_id: uuid.UUID | None,
    media: dict[str, Any],
    settings: Settings | None = None,
    use_prod_media: bool = False,
) -> CulturalPlace:
    slug = str(entry["slug"])
    if use_prod_media and settings is not None:
        merged_media = {**_prod_media_for_place(entry, settings), **media}
        source_name = _PROD_SOURCE
        source_url = settings.web_frontend_url.rstrip("/")
    else:
        media_payload = REIMS_CULTURAL_MEDIA_BY_SLUG.get(slug, {})
        merged_media = {**media_payload, **media}
        source_name = _SOURCE
        source_url = _SOURCE_URL

    normalized = normalize_cultural_media(
        hero_image_url=merged_media.get("hero_image_url"),
        thumbnail_image_url=merged_media.get("thumbnail_image_url"),
        gallery_images=merged_media.get("gallery_images"),
        photo_credit=merged_media.get("photo_credit"),
        image_credit=merged_media.get("image_credit"),
        image_source=merged_media.get("image_source"),
        editorial_excerpt=merged_media.get("editorial_excerpt"),
        image_blurhash=merged_media.get("image_blurhash"),
    )

    image_alt = entry.get("image_alt") or f"{entry['name']} — Reims"

    return CulturalPlace(
        id=entry["id"],
        slug=slug,
        name=entry["name"],
        short_description=entry["short_description"],
        description=entry.get("description"),
        city=REIMS_CITY,
        neighborhood_id=neighborhood_id,
        address=entry["address"],
        latitude=entry["latitude"],
        longitude=entry["longitude"],
        category=entry["category"],
        image_url=normalized.image_url,
        hero_image_url=normalized.hero_image_url,
        gallery_images=normalized.gallery_images or None,
        thumbnail_image_url=normalized.thumbnail_image_url,
        image_alt=image_alt,
        source_name=source_name,
        source_url=source_url,
        photo_credit=normalized.photo_credit,
        image_credit=normalized.image_credit,
        image_source=normalized.image_source,
        image_license=merged_media.get("image_license"),
        editorial_excerpt=normalized.editorial_excerpt,
        image_blurhash=normalized.image_blurhash,
        featured_priority=int(merged_media.get("featured_priority", 0)),
        is_featured=bool(merged_media.get("is_featured", False)),
        is_active=True,
    )


async def seed_reims_cultural_places(
    session: AsyncSession,
    *,
    settings: Settings | None = None,
    official_only: bool = False,
) -> tuple[int, int]:
    hood_ids = await _neighborhood_ids_by_slug(session, REIMS_CITY)
    entries = REIMS_CULTURAL_PLACES_SEED
    if official_only:
        official_slugs = set(REIMS_OFFICIAL_CULTURAL_PLACE_SLUGS)
        entries = tuple(entry for entry in entries if entry["slug"] in official_slugs)

    use_prod_media = settings is not None and settings.app_env in ("prod", "preprod")
    places_created = 0
    places_updated = 0

    for entry in entries:
        hood_slug = entry.get("neighborhood_slug")
        neighborhood_id = hood_ids.get(hood_slug) if isinstance(hood_slug, str) else None
        row = _build_place_row(
            entry,
            neighborhood_id=neighborhood_id,
            media={},
            settings=settings,
            use_prod_media=use_prod_media,
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
                places_created += 1
            else:
                for field in _MEDIA_SYNC_FIELDS:
                    setattr(found, field, getattr(row, field))
                places_updated += 1
        else:
            for field in _MEDIA_SYNC_FIELDS:
                setattr(repo_row, field, getattr(row, field))
            places_updated += 1

    await session.flush()
    logger.info(
        "reims_cultural_places_seed_completed",
        extra={
            "places_created": places_created,
            "places_updated": places_updated,
            "places_total": len(entries),
            "official_only": official_only,
        },
    )
    return places_created, places_updated
