"""Idempotent Reims neighborhood catalog seed (TICKET-602)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.neighborhood_constants import NeighborhoodAmbiance
from app.core.neighborhood_hero_assets import (
    neighborhood_hero_storage_key,
    neighborhood_seed_cover_url,
)
from app.core.neighborhood_v2_constants import NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT
from app.models.neighborhood import Neighborhood

logger = logging.getLogger(__name__)

REIMS_CITY = "Reims"

REIMS_NEIGHBORHOOD_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000001"),
        "slug": "centre-ville",
        "display_name": "Centre-ville",
        "short_description": (
            "Le cœur historique de Reims — cathédrale, commerces et vie de rue "
            "sans l’agitation des grandes métropoles."
        ),
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "latitude": 49.2583,
        "longitude": 4.0317,
        "radius_meters": 800,
        "accent_color": "#EEF0FF",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000002"),
        "slug": "saint-remi",
        "display_name": "Saint-Remi",
        "short_description": (
            "Autour de la basilique et des ruelles calmes — une Reims culturelle "
            "et habitée, idéale pour flâner."
        ),
        "ambiance": NeighborhoodAmbiance.CULTURAL.value,
        "latitude": 49.2430,
        "longitude": 4.0310,
        "radius_meters": 700,
        "accent_color": "#F5F3FF",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000003"),
        "slug": "clairmarais",
        "display_name": "Clairmarais",
        "short_description": (
            "Quartier vivant entre canal et rues commerçantes — rencontres, cafés "
            "et vie locale au rythme du quotidien."
        ),
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "latitude": 49.2620,
        "longitude": 4.0280,
        "radius_meters": 650,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000004"),
        "slug": "cernay",
        "display_name": "Cernay",
        "short_description": (
            "Un Reims populaire et résidentiel — proximité, marchés et habitudes "
            "de quartier ancrées."
        ),
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "latitude": 49.2445,
        "longitude": 4.0165,
        "radius_meters": 750,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000005"),
        "slug": "boulingrin",
        "display_name": "Boulingrin",
        "short_description": (
            "Halles, terrasses et énergie douce — le quartier où l’on se retrouve "
            "autour d’un café ou d’un marché."
        ),
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "latitude": 49.2565,
        "longitude": 4.0285,
        "radius_meters": 500,
        "accent_color": "#EEF0FF",
        "is_featured": True,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000006"),
        "slug": "croix-rouge",
        "display_name": "Croix-Rouge",
        "short_description": (
            "Un des visages résidentiels de Reims — parcs, écoles et vie de "
            "quartier loin du tumulte du centre."
        ),
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "latitude": 49.2385,
        "longitude": 4.0780,
        "radius_meters": 900,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000007"),
        "slug": "murigny",
        "display_name": "Murigny",
        "short_description": (
            "Quartier résidentiel au sud de Reims — rues calmes, commerces de "
            "proximité et cadre de vie familial."
        ),
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "latitude": 49.2200,
        "longitude": 4.0500,
        "radius_meters": 750,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000008"),
        "slug": "jean-jaures",
        "display_name": "Jean-Jaurès",
        "short_description": (
            "Un quartier populaire et connecté — vie étudiante, commerces et "
            "énergie du quotidien rémois."
        ),
        "ambiance": NeighborhoodAmbiance.STUDENT.value,
        "latitude": 49.2500,
        "longitude": 4.0200,
        "radius_meters": 700,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000009"),
        "slug": "la-neuvillette",
        "display_name": "La Neuvillette",
        "short_description": (
            "Au nord de Reims — zones d'activité, logements récents et "
            "dynamisme en développement."
        ),
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "latitude": 49.2800,
        "longitude": 4.0600,
        "radius_meters": 850,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000010"),
        "slug": "orgeval",
        "display_name": "Orgeval",
        "short_description": (
            "Quartier ouest de Reims — résidentiel, espaces verts et "
            "proximité avec la campagne champenoise."
        ),
        "ambiance": NeighborhoodAmbiance.GREEN.value,
        "latitude": 49.2700,
        "longitude": 4.0000,
        "radius_meters": 800,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000011"),
        "slug": "chemin-vert",
        "display_name": "Chemin-Vert",
        "short_description": (
            "Entre centre et faubourgs — un Reims habité, accessible et "
            "en mouvement."
        ),
        "ambiance": NeighborhoodAmbiance.LIVELY.value,
        "latitude": 49.2350,
        "longitude": 4.0400,
        "radius_meters": 700,
        "is_featured": False,
    },
    {
        "id": uuid.UUID("d6010000-0000-4000-8000-000000000012"),
        "slug": "maison-blanche",
        "display_name": "Maison-Blanche",
        "short_description": (
            "Quartier au sud-est — diversité, associations locales et "
            "solidarité de proximité."
        ),
        "ambiance": NeighborhoodAmbiance.CALM.value,
        "latitude": 49.2100,
        "longitude": 4.0100,
        "radius_meters": 800,
        "is_featured": False,
    },
)


async def seed_reims_neighborhoods(
    session: AsyncSession,
    *,
    settings: Settings | None = None,
) -> int:
    created = 0
    for row in REIMS_NEIGHBORHOOD_SEED:
        slug = str(row["slug"])
        result = await session.execute(
            select(Neighborhood.id)
            .where(
                Neighborhood.city == REIMS_CITY,
                Neighborhood.slug == slug,
            )
            .limit(1)
        )
        if result.scalar_one_or_none() is not None:
            continue
        hood_id = row["id"]
        assert isinstance(hood_id, uuid.UUID)
        cover_url = row.get("cover_image_url")
        if cover_url is None:
            if settings is not None:
                cover_url = neighborhood_seed_cover_url(
                    slug,
                    app_env=settings.app_env,
                    web_frontend_url=settings.web_frontend_url,
                )
            else:
                from app.core.neighborhood_hero_assets import neighborhood_dev_public_hero_url

                cover_url = neighborhood_dev_public_hero_url(slug)
        session.add(
            Neighborhood(
                id=hood_id,
                city=REIMS_CITY,
                slug=slug,
                display_name=str(row["display_name"]),
                short_description=str(row["short_description"]),
                ambiance=str(row["ambiance"]) if row.get("ambiance") else None,
                cover_image_url=cover_url,
                hero_image_storage_key=row.get("hero_image_storage_key")
                or neighborhood_hero_storage_key(slug),
                accent_color=row.get("accent_color"),
                latitude=row.get("latitude"),
                longitude=row.get("longitude"),
                radius_meters=row.get("radius_meters"),
                is_featured=bool(row.get("is_featured", False)),
                is_active=True,
                official_label=NEIGHBORHOOD_OFFICIAL_LABEL_DEFAULT,
            )
        )
        created += 1
    await session.flush()
    logger.info(
        "reims_neighborhoods_seed_completed",
        extra={"city": REIMS_CITY, "neighborhoods_created": created},
    )
    return created
