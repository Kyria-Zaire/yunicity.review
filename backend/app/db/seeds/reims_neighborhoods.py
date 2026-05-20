"""Idempotent Reims neighborhood catalog seed (TICKET-602)."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.neighborhood_constants import NeighborhoodAmbiance
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
)


async def seed_reims_neighborhoods(session: AsyncSession) -> None:
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
        session.add(
            Neighborhood(
                id=hood_id,
                city=REIMS_CITY,
                slug=slug,
                display_name=str(row["display_name"]),
                short_description=str(row["short_description"]),
                ambiance=str(row["ambiance"]) if row.get("ambiance") else None,
                cover_image_url=row.get("cover_image_url"),
                accent_color=row.get("accent_color"),
                latitude=row.get("latitude"),
                longitude=row.get("longitude"),
                radius_meters=row.get("radius_meters"),
                is_featured=bool(row.get("is_featured", False)),
                is_active=True,
            )
        )
    await session.flush()
    logger.info("reims_neighborhoods_seed_completed", extra={"city": REIMS_CITY})
