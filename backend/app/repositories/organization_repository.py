"""Organization persistence layer."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.organization_constants import VerificationStatus
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationVerification,
)
from app.models.user import User


class OrganizationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def slug_exists(self, slug: str) -> bool:
        result = await self._session.execute(
            select(Organization.id).where(Organization.slug == slug).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_by_id(self, organization_id: uuid.UUID) -> Organization | None:
        return await self._session.get(Organization, organization_id)

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self._session.execute(select(Organization).where(Organization.slug == slug))
        return result.scalar_one_or_none()

    async def count_pending_for_user(self, user_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Organization)
            .where(
                Organization.created_by_user_id == user_id,
                Organization.verification_status == VerificationStatus.PENDING.value,
            )
        )
        return int(result.scalar_one())

    async def find_duplicate(
        self,
        *,
        name: str,
        city: str,
        address: str | None,
    ) -> Organization | None:
        normalized_address = (address or "").strip().lower()
        result = await self._session.execute(
            select(Organization).where(
                func.lower(Organization.name) == name.strip().lower(),
                func.lower(Organization.city) == city.strip().lower(),
                func.lower(func.coalesce(Organization.address, "")) == normalized_address,
            )
        )
        return result.scalar_one_or_none()

    async def create_organization(
        self,
        *,
        organization: Organization,
        owner_member: OrganizationMember,
        verification: OrganizationVerification,
    ) -> Organization:
        self._session.add(organization)
        await self._session.flush()
        owner_member.organization_id = organization.id
        verification.organization_id = organization.id
        self._session.add(owner_member)
        self._session.add(verification)
        await self._session.flush()
        return organization

    async def update_organization(
        self,
        organization: Organization,
        *,
        fields: dict[str, Any],
    ) -> Organization:
        for key, value in fields.items():
            setattr(organization, key, value)
        await self._session.flush()
        return organization

    async def list_for_active_member(
        self, user_id: uuid.UUID
    ) -> list[tuple[Organization, OrganizationMember]]:
        result = await self._session.execute(
            select(Organization, OrganizationMember)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.status == "active",
            )
            .order_by(Organization.created_at.desc())
        )
        rows = result.all()
        return [(row[0], row[1]) for row in rows]

    async def get_active_membership(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrganizationMember | None:
        result = await self._session.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
                OrganizationMember.status == "active",
            )
        )
        return result.scalar_one_or_none()

    async def list_members(
        self,
        organization_id: uuid.UUID,
    ) -> list[OrganizationMember]:
        result = await self._session.execute(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == organization_id)
            .options(selectinload(OrganizationMember.user))
            .order_by(OrganizationMember.created_at.asc())
        )
        return list(result.scalars().all())

    async def add_verification_event(
        self,
        *,
        organization_id: uuid.UUID,
        previous_status: VerificationStatus | None,
        new_status: VerificationStatus,
        method: str | None,
        reviewed_by_user_id: uuid.UUID,
        reason: str | None,
        metadata: dict[str, Any] | None = None,
    ) -> OrganizationVerification:
        event = OrganizationVerification(
            organization_id=organization_id,
            previous_status=previous_status,
            new_status=new_status,
            method=method,
            reviewed_by_user_id=reviewed_by_user_id,
            reason=reason,
            metadata_=metadata or {},
            created_at=datetime.now(UTC),
        )
        self._session.add(event)
        await self._session.flush()
        return event

    async def get_user_email(self, user_id: uuid.UUID) -> str | None:
        user = await self._session.get(User, user_id)
        return user.email if user else None
