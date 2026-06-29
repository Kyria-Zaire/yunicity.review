"""Resolve territorial city_slug for Local Video storage keys (VIDEO-01B)."""

from __future__ import annotations

import logging
import re
import unicodedata
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization

logger = logging.getLogger(__name__)

_CITY_SLUG_RE = re.compile(r"[^a-z0-9]+")


def normalize_city_slug(city: str) -> str:
    normalized = unicodedata.normalize("NFKD", city.strip())
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = _CITY_SLUG_RE.sub("-", ascii_only.lower()).strip("-")
    if not slug:
        raise AppError(
            status_code=400,
            code="LOCAL_VIDEO_CITY_SLUG_INVALID",
            detail="Impossible de normaliser le slug de ville.",
        )
    return slug


@dataclass(frozen=True)
class CitySlugResolution:
    city_slug: str
    used_fallback: bool
    source: str


async def resolve_local_video_city_slug(
    session: AsyncSession,
    settings: Settings,
    *,
    city: str | None = None,
    neighborhood_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
) -> CitySlugResolution:
    if city is not None and city.strip():
        return CitySlugResolution(
            city_slug=normalize_city_slug(city),
            used_fallback=False,
            source="video",
        )

    if neighborhood_id is not None:
        neighborhood = await session.get(Neighborhood, neighborhood_id)
        if neighborhood is not None and neighborhood.city.strip():
            return CitySlugResolution(
                city_slug=normalize_city_slug(neighborhood.city),
                used_fallback=False,
                source="neighborhood",
            )

    if organization_id is not None:
        organization = await session.get(Organization, organization_id)
        if organization is not None and organization.city.strip():
            return CitySlugResolution(
                city_slug=normalize_city_slug(organization.city),
                used_fallback=False,
                source="organization",
            )

    if settings.app_env in {"dev", "recette"}:
        default_slug = settings.local_video_default_city_slug.strip()
        if not default_slug:
            raise AppError(
                status_code=500,
                code="LOCAL_VIDEO_DEFAULT_CITY_SLUG_MISSING",
                detail="LOCAL_VIDEO_DEFAULT_CITY_SLUG requis en dev/recette.",
            )
        logger.warning(
            "local_video_city_slug_fallback env=%s slug=%s",
            settings.app_env,
            default_slug,
        )
        return CitySlugResolution(
            city_slug=normalize_city_slug(default_slug),
            used_fallback=True,
            source="default",
        )

    raise AppError(
        status_code=400,
        code="LOCAL_VIDEO_CITY_SLUG_REQUIRED",
        detail="Ville requise pour le stockage média (city, quartier ou organisation).",
    )
