"""Admin activity feed repository (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import Select, literal, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Subquery

from app.core.admin_activity_constants import MODERATION_FEED_CATEGORIES
from app.models.creator_content_admin_action import CreatorContentAdminAction
from app.models.event_admin_action import EventAdminAction
from app.models.offer_admin_action import OfferAdminAction
from app.models.partner_admin_action import PartnerAdminAction
from app.models.passport_admin_action import PassportAdminAction
from app.models.report import Report
from app.models.report_admin_action import ReportAdminAction
from app.models.staff_admin_action import StaffAdminAction
from app.repositories.admin_cockpit_repository import AdminCockpitRawCounts, AdminCockpitRepository
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY


@dataclass(frozen=True, slots=True)
class ActivityFeedRawRow:
    category: str
    row_id: uuid.UUID
    action: str
    created_at: datetime
    actor_user_id: uuid.UUID | None
    target_id: uuid.UUID
    previous_status: str | None
    new_status: str | None


class AdminActivityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._cockpit = AdminCockpitRepository(session)

    async def fetch_attention_counts(
        self, *, city: str = DEFAULT_COCKPIT_CITY
    ) -> AdminCockpitRawCounts:
        return await self._cockpit.fetch_counts(city)

    def _partner_select(self) -> Select[Any]:
        return select(
            literal("partner").label("category"),
            PartnerAdminAction.id.label("row_id"),
            PartnerAdminAction.action.label("action"),
            PartnerAdminAction.created_at.label("created_at"),
            PartnerAdminAction.actor_user_id.label("actor_user_id"),
            PartnerAdminAction.organization_id.label("target_id"),
            PartnerAdminAction.previous_status.label("previous_status"),
            PartnerAdminAction.new_status.label("new_status"),
        ).select_from(PartnerAdminAction)

    def _passport_select(self) -> Select[Any]:
        return select(
            literal("passport").label("category"),
            PassportAdminAction.id.label("row_id"),
            PassportAdminAction.action.label("action"),
            PassportAdminAction.created_at.label("created_at"),
            PassportAdminAction.actor_user_id.label("actor_user_id"),
            PassportAdminAction.passport_id.label("target_id"),
            PassportAdminAction.previous_status.label("previous_status"),
            PassportAdminAction.new_status.label("new_status"),
        ).select_from(PassportAdminAction)

    def _offer_select(self) -> Select[Any]:
        return select(
            literal("offer").label("category"),
            OfferAdminAction.id.label("row_id"),
            OfferAdminAction.action.label("action"),
            OfferAdminAction.created_at.label("created_at"),
            OfferAdminAction.actor_user_id.label("actor_user_id"),
            OfferAdminAction.partner_offer_id.label("target_id"),
            OfferAdminAction.previous_status.label("previous_status"),
            OfferAdminAction.new_status.label("new_status"),
        ).select_from(OfferAdminAction)

    def _event_select(self) -> Select[Any]:
        return select(
            literal("event").label("category"),
            EventAdminAction.id.label("row_id"),
            EventAdminAction.action.label("action"),
            EventAdminAction.created_at.label("created_at"),
            EventAdminAction.actor_user_id.label("actor_user_id"),
            EventAdminAction.local_event_id.label("target_id"),
            EventAdminAction.previous_status.label("previous_status"),
            EventAdminAction.new_status.label("new_status"),
        ).select_from(EventAdminAction)

    def _creator_select(self) -> Select[Any]:
        return select(
            literal("creator").label("category"),
            CreatorContentAdminAction.id.label("row_id"),
            CreatorContentAdminAction.action.label("action"),
            CreatorContentAdminAction.created_at.label("created_at"),
            CreatorContentAdminAction.actor_user_id.label("actor_user_id"),
            CreatorContentAdminAction.creator_content_id.label("target_id"),
            CreatorContentAdminAction.previous_status.label("previous_status"),
            CreatorContentAdminAction.new_status.label("new_status"),
        ).select_from(CreatorContentAdminAction)

    def _report_action_select(self) -> Select[Any]:
        return select(
            literal("report").label("category"),
            ReportAdminAction.id.label("row_id"),
            ReportAdminAction.action.label("action"),
            ReportAdminAction.created_at.label("created_at"),
            ReportAdminAction.actor_user_id.label("actor_user_id"),
            ReportAdminAction.report_id.label("target_id"),
            ReportAdminAction.previous_status.label("previous_status"),
            ReportAdminAction.new_status.label("new_status"),
        ).select_from(ReportAdminAction)

    def _report_created_select(self) -> Select[Any]:
        return select(
            literal("report").label("category"),
            Report.id.label("row_id"),
            literal("report_created").label("action"),
            Report.created_at.label("created_at"),
            literal(None).label("actor_user_id"),
            Report.id.label("target_id"),
            literal(None).label("previous_status"),
            Report.status.label("new_status"),
        ).select_from(Report)

    def _staff_select(self) -> Select[Any]:
        return select(
            literal("staff").label("category"),
            StaffAdminAction.id.label("row_id"),
            StaffAdminAction.action.label("action"),
            StaffAdminAction.created_at.label("created_at"),
            StaffAdminAction.actor_user_id.label("actor_user_id"),
            StaffAdminAction.target_user_id.label("target_id"),
            literal(None).label("previous_status"),
            literal(None).label("new_status"),
        ).select_from(StaffAdminAction)

    def _resolve_source_categories(
        self,
        *,
        category: str,
        include_staff: bool,
    ) -> list[str]:
        if category == "all":
            sources = [
                "partner",
                "passport",
                "offer",
                "event",
                "creator",
                "report",
            ]
            if include_staff:
                sources.append("staff")
            return sources
        if category == "moderation":
            return sorted(MODERATION_FEED_CATEGORIES)
        if category == "system":
            return []
        if category == "staff" and not include_staff:
            return []
        return [category]

    def _build_union(self, sources: list[str]) -> Subquery | None:
        builders = {
            "partner": self._partner_select,
            "passport": self._passport_select,
            "offer": self._offer_select,
            "event": self._event_select,
            "creator": self._creator_select,
            "report": self._report_action_select,
            "staff": self._staff_select,
        }
        selects = [builders[name]() for name in sources if name in builders]
        if "report" in sources:
            selects.append(self._report_created_select())
        if not selects:
            return None
        if len(selects) == 1:
            return selects[0].subquery("activity_feed")
        return union_all(*selects).subquery("activity_feed")

    async def fetch_feed_rows(
        self,
        *,
        limit: int,
        cursor_created_at: datetime | None,
        cursor_id: uuid.UUID | None,
        category: str,
        include_staff: bool,
    ) -> list[ActivityFeedRawRow]:
        sources = self._resolve_source_categories(category=category, include_staff=include_staff)
        feed = self._build_union(sources)
        if feed is None:
            return []

        stmt = (
            select(feed)
            .order_by(feed.c.created_at.desc(), feed.c.row_id.desc())
            .limit(limit + 1)
        )
        if cursor_created_at is not None and cursor_id is not None:
            stmt = stmt.where(
                (feed.c.created_at < cursor_created_at)
                | ((feed.c.created_at == cursor_created_at) & (feed.c.row_id < cursor_id))
            )

        result = await self._session.execute(stmt)
        rows = result.all()
        return [
            ActivityFeedRawRow(
                category=str(row.category),
                row_id=row.row_id,
                action=str(row.action),
                created_at=row.created_at,
                actor_user_id=row.actor_user_id,
                target_id=row.target_id,
                previous_status=row.previous_status,
                new_status=row.new_status,
            )
            for row in rows
        ]

    async def fetch_organization_names(self, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not ids:
            return {}
        from app.models.organization import Organization

        result = await self._session.execute(
            select(Organization.id, Organization.name).where(Organization.id.in_(ids))
        )
        return {row.id: row.name for row in result.all()}

    async def fetch_offer_titles(self, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not ids:
            return {}
        from app.models.passport import PartnerOffer

        result = await self._session.execute(
            select(PartnerOffer.id, PartnerOffer.title).where(PartnerOffer.id.in_(ids))
        )
        return {row.id: row.title for row in result.all()}

    async def fetch_event_titles(self, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not ids:
            return {}
        from app.models.local_event import LocalEvent

        result = await self._session.execute(
            select(LocalEvent.id, LocalEvent.title).where(LocalEvent.id.in_(ids))
        )
        return {row.id: row.title for row in result.all()}

    async def fetch_creator_titles(self, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not ids:
            return {}
        from app.models.partner_creator_content import PartnerCreatorContent

        result = await self._session.execute(
            select(PartnerCreatorContent.id, PartnerCreatorContent.title).where(
                PartnerCreatorContent.id.in_(ids)
            )
        )
        return {row.id: row.title for row in result.all()}

    async def fetch_passport_numbers(self, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not ids:
            return {}
        from app.models.passport import Passport

        result = await self._session.execute(
            select(Passport.id, Passport.passport_number).where(Passport.id.in_(ids))
        )
        return {row.id: row.passport_number for row in result.all()}
