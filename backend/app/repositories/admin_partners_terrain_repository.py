"""Admin partners terrain aggregates and list (ADMIN-PARTNERS-UX-01)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.organization_constants import VerificationStatus
from app.core.partner_constants import PartnerStatus
from app.models.neighborhood import Neighborhood
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import Passport, PassportStamp
from app.repositories.admin_cockpit_repository import ORGANIZATION_PENDING_VERIFICATION_STATUSES

ACTIVE_PARTNER_STATUSES: frozenset[str] = frozenset(
    {
        PartnerStatus.ACTIVE.value,
        PartnerStatus.PREMIUM.value,
        PartnerStatus.FOUNDING_PARTNER.value,
    }
)


@dataclass(frozen=True, slots=True)
class TerrainListRow:
    organization: Organization
    partner_status: str | None
    partnership_type: str | None
    neighborhood_name: str | None
    stamps_count: int


class AdminPartnersTerrainRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_new_partners_this_month(self, *, city: str) -> int:
        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = (
            select(func.count())
            .select_from(PartnerProfile)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(
                Organization.city == city,
                or_(
                    PartnerProfile.signed_at >= month_start,
                    PartnerProfile.created_at >= month_start,
                ),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    async def count_inactive_partners(self, *, city: str) -> int:
        stmt = (
            select(func.count())
            .select_from(PartnerProfile)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(
                Organization.city == city,
                PartnerProfile.partner_status == PartnerStatus.PAUSED.value,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    async def fetch_category_breakdown(self, *, city: str) -> list[tuple[str, int]]:
        category_key = func.coalesce(PartnerProfile.partnership_type, Organization.type)
        stmt = (
            select(category_key, func.count())
            .select_from(Organization)
            .outerjoin(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(Organization.city == city)
            .group_by(category_key)
            .order_by(func.count().desc())
        )
        result = await self._session.execute(stmt)
        return [(str(key), int(count or 0)) for key, count in result.all() if key]

    async def fetch_top_active_partners(
        self,
        *,
        city: str,
        limit: int = 5,
    ) -> list[tuple[UUID, str, str | None, int]]:
        stmt = (
            select(
                Organization.id,
                Organization.name,
                Organization.logo_url,
                func.count(PassportStamp.id),
            )
            .select_from(PassportStamp)
            .join(Passport, PassportStamp.passport_id == Passport.id)
            .join(Organization, PassportStamp.organization_id == Organization.id)
            .where(Passport.city == city)
            .group_by(Organization.id, Organization.name, Organization.logo_url)
            .order_by(func.count(PassportStamp.id).desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [(row[0], row[1], row[2], int(row[3] or 0)) for row in result.all()]

    async def fetch_pending_requests(
        self,
        *,
        city: str,
        limit: int = 3,
    ) -> list[Organization]:
        stmt = (
            select(Organization)
            .where(
                Organization.city == city,
                Organization.verification_status.in_(ORGANIZATION_PENDING_VERIFICATION_STATUSES),
            )
            .order_by(Organization.updated_at.desc())
            .limit(limit)
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def fetch_map_pins(
        self,
        *,
        city: str,
        limit: int = 40,
    ) -> list[tuple[UUID, str, float, float]]:
        stmt = (
            select(
                Organization.id, Organization.name, Organization.latitude, Organization.longitude
            )
            .join(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .where(
                Organization.city == city,
                Organization.latitude.is_not(None),
                Organization.longitude.is_not(None),
            )
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [
            (row[0], row[1], float(row[2]), float(row[3]))
            for row in result.all()
            if row[2] is not None and row[3] is not None
        ]

    async def fetch_evolution_30d(self, *, city: str) -> list[tuple[date, int, int]]:
        # ADMIN-PERF-02A: a single scoped fetch + in-Python bucketing replaces the
        # previous 30-day loop of 60 COUNT round-trips. Semantics are preserved
        # exactly (a profile counts on a day if signed_at OR created_at fall in it,
        # and is cumulative once either date is <= day_end).
        today = datetime.now(UTC).date()
        start = today - timedelta(days=29)
        window_end = datetime.combine(today, datetime.max.time(), tzinfo=UTC)

        rows_stmt = (
            select(PartnerProfile.signed_at, PartnerProfile.created_at)
            .select_from(PartnerProfile)
            .join(Organization, PartnerProfile.organization_id == Organization.id)
            .where(
                Organization.city == city,
                or_(
                    PartnerProfile.signed_at <= window_end,
                    PartnerProfile.created_at <= window_end,
                ),
            )
        )
        rows = (await self._session.execute(rows_stmt)).all()

        points: list[tuple[date, int, int]] = []
        day = start
        while day <= today:
            day_start = datetime.combine(day, datetime.min.time(), tzinfo=UTC)
            day_end = datetime.combine(day, datetime.max.time(), tzinfo=UTC)
            cumulative = 0
            new_count = 0
            for signed_at, created_at in rows:
                if (signed_at is not None and signed_at <= day_end) or (
                    created_at is not None and created_at <= day_end
                ):
                    cumulative += 1
                if (signed_at is not None and day_start <= signed_at <= day_end) or (
                    created_at is not None and day_start <= created_at <= day_end
                ):
                    new_count += 1
            points.append((day, cumulative, new_count))
            day += timedelta(days=1)

        return points

    async def list_terrain(
        self,
        *,
        city: str,
        search: str | None,
        status_filter: str | None,
        partnership_type: str | None,
        organization_type: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[TerrainListRow], int]:
        stamp_counts = (
            select(
                PassportStamp.organization_id.label("organization_id"),
                func.count(PassportStamp.id).label("stamps_count"),
            )
            .join(Passport, PassportStamp.passport_id == Passport.id)
            .where(Passport.city == city)
            .group_by(PassportStamp.organization_id)
            .subquery()
        )
        neighborhood = aliased(Neighborhood)

        filters = [Organization.city == city]
        if search:
            pattern = f"%{search.strip()}%"
            filters.append(
                or_(
                    Organization.name.ilike(pattern),
                    Organization.address.ilike(pattern),
                    Organization.category.ilike(pattern),
                )
            )
        if partnership_type:
            filters.append(PartnerProfile.partnership_type == partnership_type)
        if organization_type:
            filters.append(Organization.type == organization_type)
        if status_filter == "active":
            filters.append(PartnerProfile.partner_status.in_(ACTIVE_PARTNER_STATUSES))
        elif status_filter == "pending":
            filters.append(
                or_(
                    Organization.verification_status.in_(
                        ORGANIZATION_PENDING_VERIFICATION_STATUSES
                    ),
                    PartnerProfile.partner_status == PartnerStatus.SIGNED.value,
                )
            )
        elif status_filter == "verified":
            filters.append(Organization.verification_status == VerificationStatus.VERIFIED.value)
        elif status_filter == "inactive":
            filters.append(PartnerProfile.partner_status == PartnerStatus.PAUSED.value)

        base = (
            select(
                Organization,
                PartnerProfile.partner_status,
                PartnerProfile.partnership_type,
                neighborhood.display_name,
                func.coalesce(stamp_counts.c.stamps_count, 0),
            )
            .outerjoin(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .outerjoin(neighborhood, Organization.neighborhood_id == neighborhood.id)
            .outerjoin(stamp_counts, stamp_counts.c.organization_id == Organization.id)
            .where(*filters)
        )

        count_stmt = (
            select(func.count())
            .select_from(Organization)
            .outerjoin(PartnerProfile, PartnerProfile.organization_id == Organization.id)
            .outerjoin(neighborhood, Organization.neighborhood_id == neighborhood.id)
            .where(*filters)
        )
        total = int((await self._session.execute(count_stmt)).scalar_one() or 0)

        stmt = (
            base.order_by(Organization.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            TerrainListRow(
                organization=row[0],
                partner_status=row[1],
                partnership_type=row[2],
                neighborhood_name=row[3],
                stamps_count=int(row[4] or 0),
            )
            for row in result.all()
        ]
        return rows, total
