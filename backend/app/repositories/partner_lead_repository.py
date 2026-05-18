"""Partner lead persistence layer."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.partner_lead_constants import PartnerLeadStatus
from app.models.partner_lead import PartnerLead


class PartnerLeadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, lead_id: uuid.UUID) -> PartnerLead | None:
        return await self._session.get(PartnerLead, lead_id)

    async def find_duplicate(
        self,
        *,
        name: str,
        city: str | None,
        phone: str | None,
        exclude_id: uuid.UUID | None = None,
    ) -> PartnerLead | None:
        name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
            name=name,
            city=city,
            phone=phone,
        )
        query = select(PartnerLead).where(
            PartnerLead.name_normalized == name_key,
            PartnerLead.city_normalized == city_key,
            PartnerLead.phone_normalized == phone_key,
        )
        if exclude_id is not None:
            query = query.where(PartnerLead.id != exclude_id)
        result = await self._session.execute(query.limit(1))
        return result.scalar_one_or_none()

    async def find_duplicates_by_keys(
        self,
        keys: list[tuple[str, str, str]],
    ) -> list[PartnerLead]:
        if not keys:
            return []
        conditions = []
        for name_key, city_key, phone_key in keys:
            conditions.append(
                (PartnerLead.name_normalized == name_key)
                & (PartnerLead.city_normalized == city_key)
                & (PartnerLead.phone_normalized == phone_key)
            )
        result = await self._session.execute(
            select(PartnerLead).where(or_(*conditions))
        )
        return list(result.scalars().all())

    async def create(self, lead: PartnerLead) -> PartnerLead:
        self._session.add(lead)
        await self._session.flush()
        return lead

    async def update(self, lead: PartnerLead, *, fields: dict[str, Any]) -> PartnerLead:
        for key, value in fields.items():
            setattr(lead, key, value)
        await self._session.flush()
        return lead

    async def list_leads(
        self,
        *,
        status: str | None,
        source: str | None,
        city: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PartnerLead], int]:
        filters = []
        if status is not None:
            filters.append(PartnerLead.status == status)
        if source is not None:
            filters.append(PartnerLead.source == source)
        if city is not None:
            filters.append(func.lower(PartnerLead.city) == city.strip().lower())

        count_query = select(func.count()).select_from(PartnerLead)
        list_query = select(PartnerLead)
        if filters:
            count_query = count_query.where(*filters)
            list_query = list_query.where(*filters)

        total_result = await self._session.execute(count_query)
        total = int(total_result.scalar_one())

        offset = (page - 1) * page_size
        list_query = (
            list_query.order_by(PartnerLead.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self._session.execute(list_query)
        return list(result.scalars().all()), total

    async def count_all(self) -> int:
        result = await self._session.execute(select(func.count()).select_from(PartnerLead))
        return int(result.scalar_one())

    async def is_converted(self, lead: PartnerLead) -> bool:
        return lead.status == PartnerLeadStatus.CONVERTED.value or (
            lead.converted_organization_id is not None
        )
