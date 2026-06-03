"""Admin organization verification queue persistence (ADMIN-02B1)."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.organization_constants import VerificationStatus
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile


@dataclass(frozen=True, slots=True)
class AdminOrganizationListRow:
    organization: Organization
    partner_status: str | None
    partnership_type: str | None


class AdminOrganizationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_admin(
        self,
        *,
        city: str,
        verification_status: VerificationStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminOrganizationListRow], int]:
        filters = [Organization.city == city]
        if verification_status is not None:
            filters.append(Organization.verification_status == verification_status.value)

        count_stmt = select(func.count()).select_from(Organization).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(
                Organization,
                PartnerProfile.partner_status,
                PartnerProfile.partnership_type,
            )
            .outerjoin(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(*filters)
            .order_by(Organization.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminOrganizationListRow(
                organization=row[0],
                partner_status=row[1],
                partnership_type=row[2],
            )
            for row in result.all()
        ]
        return rows, total
