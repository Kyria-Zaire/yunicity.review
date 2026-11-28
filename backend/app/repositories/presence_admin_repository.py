"""Data access for staff presence administration (PASSPORT-PRESENCE-01, lot 01A)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.presence import (
    PresenceAdminAction,
    PresenceAgentAssignment,
    PresenceCampaign,
    PresenceRegistration,
)
from app.models.user import User


class PresenceAdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def organization_exists(self, organization_id: uuid.UUID) -> bool:
        stmt = select(Organization.id).where(Organization.id == organization_id)
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    async def local_event_exists(self, local_event_id: uuid.UUID) -> bool:
        stmt = select(LocalEvent.id).where(LocalEvent.id == local_event_id)
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    async def get_user(self, user_id: uuid.UUID, *, for_update: bool = False) -> User | None:
        stmt = select(User).where(User.id == user_id)
        if for_update:
            stmt = stmt.with_for_update()
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def add_campaign(self, campaign: PresenceCampaign) -> PresenceCampaign:
        self._session.add(campaign)
        await self._session.flush()
        return campaign

    async def get_campaign(
        self, campaign_id: uuid.UUID, *, for_update: bool = False
    ) -> PresenceCampaign | None:
        stmt = select(PresenceCampaign).where(PresenceCampaign.id == campaign_id)
        if for_update:
            stmt = stmt.with_for_update()
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_campaigns(
        self,
        *,
        status: str | None,
        organization_id: uuid.UUID | None,
        is_test: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[PresenceCampaign], int]:
        filters = []
        if status is not None:
            filters.append(PresenceCampaign.status == status)
        if organization_id is not None:
            filters.append(PresenceCampaign.organization_id == organization_id)
        if is_test is not None:
            filters.append(PresenceCampaign.is_test.is_(is_test))

        total_stmt = select(func.count()).select_from(PresenceCampaign).where(*filters)
        total = int((await self._session.execute(total_stmt)).scalar_one())

        stmt = (
            select(PresenceCampaign)
            .where(*filters)
            .order_by(PresenceCampaign.created_at.desc(), PresenceCampaign.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list((await self._session.execute(stmt)).scalars().all())
        return items, total

    # ------------------------------------------------------------ registrations

    async def get_registration_for_update(
        self, campaign_id: uuid.UUID, user_id: uuid.UUID
    ) -> PresenceRegistration | None:
        stmt = (
            select(PresenceRegistration)
            .where(
                PresenceRegistration.campaign_id == campaign_id,
                PresenceRegistration.user_id == user_id,
            )
            .with_for_update()
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def insert_registration_if_absent(
        self,
        *,
        campaign_id: uuid.UUID,
        user_id: uuid.UUID,
        status: str,
        changed_by_user_id: uuid.UUID,
        changed_at: datetime,
    ) -> bool:
        """Insert unless a concurrent request already did; never raises on the unique key."""
        stmt = (
            pg_insert(PresenceRegistration)
            .values(
                id=uuid.uuid4(),
                campaign_id=campaign_id,
                user_id=user_id,
                status=status,
                status_changed_at=changed_at,
                changed_by_user_id=changed_by_user_id,
            )
            .on_conflict_do_nothing(constraint="uq_presence_registrations_campaign_user")
            .returning(PresenceRegistration.id)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    # -------------------------------------------------------------- assignments

    async def get_assignment_for_update(
        self, campaign_id: uuid.UUID, agent_user_id: uuid.UUID
    ) -> PresenceAgentAssignment | None:
        stmt = (
            select(PresenceAgentAssignment)
            .where(
                PresenceAgentAssignment.campaign_id == campaign_id,
                PresenceAgentAssignment.agent_user_id == agent_user_id,
            )
            .with_for_update()
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def insert_assignment_if_absent(
        self,
        *,
        campaign_id: uuid.UUID,
        agent_user_id: uuid.UUID,
        status: str,
        changed_by_user_id: uuid.UUID,
        changed_at: datetime,
    ) -> bool:
        stmt = (
            pg_insert(PresenceAgentAssignment)
            .values(
                id=uuid.uuid4(),
                campaign_id=campaign_id,
                agent_user_id=agent_user_id,
                status=status,
                status_changed_at=changed_at,
                changed_by_user_id=changed_by_user_id,
            )
            .on_conflict_do_nothing(constraint="uq_presence_agent_assignments_campaign_agent")
            .returning(PresenceAgentAssignment.id)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    # -------------------------------------------------------------------- audit

    async def record_admin_action(
        self,
        *,
        action: str,
        actor_user_id: uuid.UUID,
        campaign_id: uuid.UUID | None,
        target_user_id: uuid.UUID | None,
        previous_value: str | None,
        new_value: str | None,
        created_at: datetime,
    ) -> None:
        self._session.add(
            PresenceAdminAction(
                action=action,
                actor_user_id=actor_user_id,
                campaign_id=campaign_id,
                target_user_id=target_user_id,
                previous_value=previous_value,
                new_value=new_value,
                created_at=created_at,
            )
        )
        await self._session.flush()
