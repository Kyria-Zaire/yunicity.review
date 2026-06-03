"""Admin organization verification queue service (ADMIN-02B1)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.organization_constants import VerificationStatus
from app.core.partner_constants import PartnershipType, PartnerStatus
from app.repositories.admin_organization_repository import (
    AdminOrganizationListRow,
    AdminOrganizationRepository,
)
from app.schemas.admin_organization import (
    ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX,
    DEFAULT_ADMIN_ORGANIZATIONS_CITY,
    AdminOrganizationListItem,
    AdminOrganizationListResponse,
)


class AdminOrganizationService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AdminOrganizationRepository(session)

    async def list_organizations(
        self,
        *,
        city: str | None,
        verification_status: VerificationStatus | None,
        page: int,
        page_size: int,
    ) -> AdminOrganizationListResponse:
        resolved_city = (
            (city or DEFAULT_ADMIN_ORGANIZATIONS_CITY).strip() or DEFAULT_ADMIN_ORGANIZATIONS_CITY
        )
        resolved_page_size = min(
            max(page_size, 1),
            ADMIN_ORGANIZATION_LIST_PAGE_SIZE_MAX,
        )
        resolved_page = max(page, 1)

        rows, total = await self._repo.list_for_admin(
            city=resolved_city,
            verification_status=verification_status,
            page=resolved_page,
            page_size=resolved_page_size,
        )
        items = [self._to_list_item(row) for row in rows]
        return AdminOrganizationListResponse(
            items=items,
            total=total,
            page=resolved_page,
            page_size=resolved_page_size,
        )

    def _to_list_item(self, row: AdminOrganizationListRow) -> AdminOrganizationListItem:
        org = row.organization
        partner_status = (
            PartnerStatus(row.partner_status) if row.partner_status is not None else None
        )
        partnership_type = (
            PartnershipType(row.partnership_type)
            if row.partnership_type is not None
            else None
        )
        return AdminOrganizationListItem(
            id=org.id,
            name=org.name,
            slug=org.slug,
            type=org.type,
            city=org.city,
            visibility=org.visibility,
            verification_status=org.verification_status,
            created_at=org.created_at,
            updated_at=org.updated_at,
            partner_status=partner_status,
            partnership_type=partnership_type,
        )
