"""Admin partners terrain list service."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.partner_constants import PartnershipType, PartnerStatus
from app.repositories.admin_partners_terrain_repository import AdminPartnersTerrainRepository
from app.schemas.admin_partners_terrain import (
    TERRAIN_LIST_PAGE_SIZE_DEFAULT,
    TERRAIN_LIST_PAGE_SIZE_MAX,
    AdminPartnersTerrainListItem,
    AdminPartnersTerrainListResponse,
)


class AdminPartnersTerrainService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminPartnersTerrainRepository(session)

    async def list_terrain(
        self,
        *,
        city: str,
        search: str | None = None,
        status: str | None = None,
        partnership_type: str | None = None,
        organization_type: str | None = None,
        page: int = 1,
        page_size: int = TERRAIN_LIST_PAGE_SIZE_DEFAULT,
    ) -> AdminPartnersTerrainListResponse:
        safe_page = max(page, 1)
        safe_page_size = min(max(page_size, 1), TERRAIN_LIST_PAGE_SIZE_MAX)
        rows, total = await self._repo.list_terrain(
            city=city.strip(),
            search=search,
            status_filter=status,
            partnership_type=partnership_type,
            organization_type=organization_type,
            page=safe_page,
            page_size=safe_page_size,
        )
        return AdminPartnersTerrainListResponse(
            items=[
                AdminPartnersTerrainListItem(
                    organization_id=row.organization.id,
                    name=row.organization.name,
                    slug=row.organization.slug,
                    logo_url=row.organization.logo_url,
                    organization_type=row.organization.type,
                    partnership_type=(
                        PartnershipType(row.partnership_type)
                        if row.partnership_type is not None
                        else None
                    ),
                    category=row.organization.category,
                    neighborhood_name=row.neighborhood_name,
                    address=row.organization.address,
                    city=row.organization.city,
                    verification_status=row.organization.verification_status,
                    partner_status=(
                        PartnerStatus(row.partner_status)
                        if row.partner_status is not None
                        else None
                    ),
                    stamps_count=row.stamps_count,
                    updated_at=row.organization.updated_at,
                )
                for row in rows
            ],
            total=total,
            page=safe_page,
            page_size=safe_page_size,
        )
