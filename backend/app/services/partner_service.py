"""Signed partners business logic (WEB-PARTNERS-01)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.partner_constants import (
    PARTNER_LIST_LIMIT_DEFAULT,
    PARTNER_LIST_LIMIT_MAX,
    PUBLIC_PARTNER_STATUSES,
    PartnershipType,
    PartnerStatus,
    is_public_partner_status,
)
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.repositories.partner_repository import PartnerRepository
from app.schemas.partner import PartnerListResponse, PartnerPublicDetail, PartnerPublicItem


class PartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = PartnerRepository(session)

    async def list_public(
        self,
        *,
        city: str,
        status: PartnerStatus | None,
        partnership_type: PartnershipType | None,
        featured_only: bool,
        limit: int,
        offset: int,
    ) -> PartnerListResponse:
        trimmed_city = city.strip()
        statuses = self._resolve_status_filter(status)
        capped_limit = min(max(limit, 1), PARTNER_LIST_LIMIT_MAX)
        safe_offset = max(offset, 0)
        total = await self._repo.count_public(
            city=trimmed_city,
            statuses=statuses,
            partnership_type=partnership_type,
            featured_only=featured_only,
        )
        rows = await self._repo.list_public(
            city=trimmed_city,
            statuses=statuses,
            partnership_type=partnership_type,
            featured_only=featured_only,
            limit=capped_limit,
            offset=safe_offset,
        )
        return PartnerListResponse(
            city=trimmed_city,
            items=[self._to_public_item(row) for row in rows],
            count=len(rows),
            total=total,
            offset=safe_offset,
            limit=capped_limit,
        )

    async def get_public_by_slug(self, *, city: str, slug: str) -> PartnerPublicDetail:
        trimmed_city = city.strip()
        normalized_slug = slug.strip().lower()
        row = await self._repo.get_by_slug(city=trimmed_city, slug=normalized_slug)
        if row is None or not is_public_partner_status(row.partner_status):
            raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable")
        return PartnerPublicDetail.model_validate(self._to_public_item(row))

    @staticmethod
    def _resolve_status_filter(status: PartnerStatus | None) -> frozenset[PartnerStatus]:
        if status is None:
            return PUBLIC_PARTNER_STATUSES
        if status not in PUBLIC_PARTNER_STATUSES:
            return frozenset()
        return frozenset({status})

    def _to_public_item(self, row: PartnerProfile) -> PartnerPublicItem:
        org = row.organization
        expose_location = is_public_partner_status(row.partner_status)
        return PartnerPublicItem(
            id=row.id,
            organization_id=org.id,
            name=org.name,
            slug=org.slug,
            category=org.category,
            city=org.city,
            description=org.description,
            logo_url=org.logo_url,
            cover_image_url=org.banner_url,
            is_featured=row.is_featured,
            partner_status=(
                row.partner_status
                if isinstance(row.partner_status, PartnerStatus)
                else PartnerStatus(row.partner_status)
            ),
            partnership_type=(
                row.partnership_type
                if isinstance(row.partnership_type, PartnershipType)
                else PartnershipType(row.partnership_type)
            ),
            public_partner_label=row.public_partner_label,
            address=org.address if expose_location else None,
            postal_code=org.postal_code if expose_location else None,
            latitude=float(org.latitude) if expose_location and org.latitude is not None else None,
            longitude=(
                float(org.longitude) if expose_location and org.longitude is not None else None
            ),
            website_url=org.website,
            phone=org.phone if expose_location else None,
            instagram_url=_instagram_from_social_links(org),
            is_verified=self._repo.is_verified_organization(org),
        )


def _instagram_from_social_links(org: Organization) -> str | None:
    links = org.social_links if isinstance(org.social_links, dict) else {}
    raw = links.get("instagram")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return None


def default_partner_list_limit(limit: int) -> int:
    if limit <= 0:
        return PARTNER_LIST_LIMIT_DEFAULT
    return limit
