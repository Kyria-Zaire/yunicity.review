"""Neighborhood catalog business logic (TICKET-602)."""

from __future__ import annotations

import re

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.neighborhood_constants import (
    MVP_NEIGHBORHOOD_AMBIANCES,
    NEIGHBORHOOD_LIST_PAGE_SIZE_MAX,
)
from app.models.neighborhood import Neighborhood
from app.repositories.neighborhood_repository import NeighborhoodRepository
from app.schemas.neighborhood import (
    NeighborhoodCreateRequest,
    NeighborhoodListResponse,
    NeighborhoodResponse,
    NeighborhoodUpdateRequest,
)

_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class NeighborhoodService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._neighborhoods = NeighborhoodRepository(session)

    async def list_public(
        self,
        *,
        city: str,
        featured_only: bool,
        page: int,
        page_size: int,
    ) -> NeighborhoodListResponse:
        page_size = min(max(page_size, 1), NEIGHBORHOOD_LIST_PAGE_SIZE_MAX)
        offset = (max(page, 1) - 1) * page_size
        rows = await self._neighborhoods.list_for_city(
            city=city,
            featured_only=featured_only,
            active_only=True,
            limit=page_size,
            offset=offset,
        )
        total = await self._neighborhoods.count_for_city(
            city=city,
            featured_only=featured_only,
            active_only=True,
        )
        return NeighborhoodListResponse(
            items=[self._to_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_public_by_slug(self, *, city: str, slug: str) -> NeighborhoodResponse:
        row = await self._neighborhoods.get_by_city_slug(city=city, slug=slug, active_only=True)
        if row is None:
            raise AppError(
                status_code=404,
                code="NEIGHBORHOOD_NOT_FOUND",
                detail="Quartier introuvable.",
            )
        return self._to_response(row)

    async def create_admin(self, payload: NeighborhoodCreateRequest) -> NeighborhoodResponse:
        self._validate_slug(payload.slug)
        self._validate_ambiance(payload.ambiance)
        slug = payload.slug.strip().lower()
        row = Neighborhood(
            city=payload.city.strip(),
            slug=slug,
            display_name=payload.display_name.strip(),
            short_description=payload.short_description,
            ambiance=payload.ambiance,
            cover_image_url=payload.cover_image_url,
            accent_color=payload.accent_color,
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_meters=payload.radius_meters,
            is_featured=payload.is_featured,
            is_active=payload.is_active,
        )
        try:
            created = await self._neighborhoods.add(row)
            await self._session.commit()
            await self._session.refresh(created)
        except IntegrityError as exc:
            await self._session.rollback()
            raise AppError(
                status_code=409,
                code="NEIGHBORHOOD_ALREADY_EXISTS",
                detail="Un quartier avec ce slug existe déjà dans cette ville.",
            ) from exc
        return self._to_response(created)

    async def update_admin(
        self,
        *,
        city: str,
        slug: str,
        payload: NeighborhoodUpdateRequest,
    ) -> NeighborhoodResponse:
        row = await self._require_by_city_slug(city=city, slug=slug)
        self._validate_ambiance(payload.ambiance)
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            if key == "display_name" and value is not None:
                setattr(row, key, str(value).strip())
            else:
                setattr(row, key, value)
        await self._session.commit()
        await self._session.refresh(row)
        return self._to_response(row)

    async def deactivate_admin(self, *, city: str, slug: str) -> NeighborhoodResponse:
        row = await self._require_by_city_slug(city=city, slug=slug)
        row.is_active = False
        await self._session.commit()
        await self._session.refresh(row)
        return self._to_response(row)

    async def _require_by_city_slug(self, *, city: str, slug: str) -> Neighborhood:
        row = await self._neighborhoods.get_by_city_slug(city=city, slug=slug, active_only=False)
        if row is None:
            raise AppError(
                status_code=404,
                code="NEIGHBORHOOD_NOT_FOUND",
                detail="Quartier introuvable.",
            )
        return row

    @staticmethod
    def _validate_slug(slug: str) -> None:
        normalized = slug.strip().lower()
        if not _SLUG_PATTERN.match(normalized):
            raise AppError(
                status_code=422,
                code="INVALID_NEIGHBORHOOD_SLUG",
                detail=(
                    "Le slug doit contenir uniquement des lettres minuscules, "
                    "chiffres et tirets."
                ),
            )

    @staticmethod
    def _validate_ambiance(ambiance: str | None) -> None:
        if ambiance is None:
            return
        if ambiance not in MVP_NEIGHBORHOOD_AMBIANCES:
            raise AppError(
                status_code=422,
                code="INVALID_NEIGHBORHOOD_AMBIANCE",
                detail="Ambiance de quartier invalide.",
            )

    @staticmethod
    def _to_response(row: Neighborhood) -> NeighborhoodResponse:
        return NeighborhoodResponse(
            id=row.id,
            city=row.city,
            slug=row.slug,
            display_name=row.display_name,
            short_description=row.short_description,
            ambiance=row.ambiance,
            cover_image_url=row.cover_image_url,
            accent_color=row.accent_color,
            latitude=float(row.latitude) if row.latitude is not None else None,
            longitude=float(row.longitude) if row.longitude is not None else None,
            radius_meters=row.radius_meters,
            is_featured=row.is_featured,
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
