"""Admin activity center service (ADMIN-NOTIFICATIONS-01B)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_activity_constants import AdminActivityHealthStatus
from app.core.staff_admin_constants import SYSTEM_ADMIN_PERMISSION
from app.db.session import check_database
from app.integrations.redis import check_redis
from app.models.user import User
from app.repositories.admin_activity_repository import AdminActivityRepository
from app.repositories.admin_cockpit_repository import AdminCockpitRawCounts
from app.schemas.admin_activity import (
    AdminActivityAlert,
    AdminActivityAttentionSummary,
    AdminActivityFeedItem,
    AdminActivityFeedResponse,
    AdminActivityHealth,
    AdminActivitySections,
    AdminActivitySectionSummary,
    AdminActivitySummaryResponse,
)
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY
from app.services.admin_activity_presenter import (
    actor_label,
    aggregate_section_severity,
    build_action_description,
    build_action_title,
    build_target_href,
    count_severity,
    decode_feed_cursor,
    encode_feed_cursor,
    feed_item_severity,
    map_check_status,
    resolve_target_label,
)
from app.services.rbac_service import RbacService


class AdminActivityService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AdminActivityRepository(session)

    async def get_summary(self, *, city: str | None = None) -> AdminActivitySummaryResponse:
        resolved_city = (city or DEFAULT_COCKPIT_CITY).strip() or DEFAULT_COCKPIT_CITY
        counts = await self._repo.fetch_attention_counts(city=resolved_city)
        db_raw = await check_database()
        redis_raw = await check_redis()
        database = map_check_status(db_raw)
        redis = map_check_status(redis_raw)

        health_status = self._resolve_health_status(database=database, redis=redis)
        alerts = self._build_alerts(counts, database=database, redis=redis)
        attention = self._build_attention(alerts)
        sections = self._build_sections(counts, database=database, redis=redis)

        return AdminActivitySummaryResponse(
            generated_at=datetime.now(UTC),
            read_only=True,
            health=AdminActivityHealth(
                status=health_status,
                database=database,
                redis=redis,
            ),
            attention=attention,
            alerts=alerts,
            sections=sections,
        )

    async def get_feed(
        self,
        *,
        viewer: User,
        limit: int,
        cursor: str | None,
        category: str,
    ) -> AdminActivityFeedResponse:
        include_staff = await self._viewer_can_see_staff(viewer.id)
        cursor_created_at: datetime | None = None
        cursor_id: uuid.UUID | None = None
        if cursor:
            try:
                cursor_created_at, cursor_id = decode_feed_cursor(cursor)
            except ValueError as exc:
                from app.core.errors import AppError

                raise AppError(
                    status_code=422,
                    code="INVALID_CURSOR",
                    detail="Curseur de pagination invalide.",
                ) from exc

        raw_rows = await self._repo.fetch_feed_rows(
            limit=limit,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
            category=category,
            include_staff=include_staff,
        )
        has_more = len(raw_rows) > limit
        page_rows = raw_rows[:limit]

        organization_ids = {row.target_id for row in page_rows if row.category == "partner"}
        offer_ids = {row.target_id for row in page_rows if row.category == "offer"}
        event_ids = {row.target_id for row in page_rows if row.category == "event"}
        creator_ids = {row.target_id for row in page_rows if row.category == "creator"}
        passport_ids = {row.target_id for row in page_rows if row.category == "passport"}

        organization_names = await self._repo.fetch_organization_names(organization_ids)
        offer_titles = await self._repo.fetch_offer_titles(offer_ids)
        event_titles = await self._repo.fetch_event_titles(event_ids)
        creator_titles = await self._repo.fetch_creator_titles(creator_ids)
        passport_numbers = await self._repo.fetch_passport_numbers(passport_ids)

        items: list[AdminActivityFeedItem] = []
        for row in page_rows:
            target_label = resolve_target_label(
                row,
                organization_names=organization_names,
                offer_titles=offer_titles,
                event_titles=event_titles,
                creator_titles=creator_titles,
                passport_numbers=passport_numbers,
            )
            items.append(
                AdminActivityFeedItem(
                    id=f"{row.category}:{row.row_id}",
                    category=row.category,  # type: ignore[arg-type]
                    action=row.action,
                    title=build_action_title(row),
                    description=build_action_description(row, target_label),
                    actor_label=actor_label(row),
                    target_label=target_label,
                    target_id=str(row.target_id),
                    href=build_target_href(row),
                    severity=feed_item_severity(row.category, row.action),
                    created_at=row.created_at,
                )
            )

        next_cursor = None
        if has_more and page_rows:
            last = page_rows[-1]
            next_cursor = encode_feed_cursor(last.created_at, last.row_id)

        return AdminActivityFeedResponse(
            generated_at=datetime.now(UTC),
            items=items,
            next_cursor=next_cursor,
        )

    async def _viewer_can_see_staff(self, user_id: uuid.UUID) -> bool:
        return await RbacService(self._session).user_has_permission(
            user_id,
            SYSTEM_ADMIN_PERMISSION,
        )

    def _resolve_health_status(
        self,
        *,
        database: str,
        redis: str,
    ) -> AdminActivityHealthStatus:
        if database == "error" or redis == "error":
            return "critical"
        if database == "unknown" or redis == "unknown":
            return "degraded"
        return "healthy"

    def _build_alerts(
        self,
        counts: AdminCockpitRawCounts,
        *,
        database: str,
        redis: str,
    ) -> list[AdminActivityAlert]:
        alert_specs = [
            (
                "pending_offers",
                "Offres en attente",
                "Des offres partenaires attendent une validation.",
                counts.offers_pending,
                "/passport-offers?status=pending_review",
                "moderation",
            ),
            (
                "pending_events",
                "Événements en attente",
                "Des événements locaux attendent une validation.",
                counts.events_pending,
                "/events?status=pending_review",
                "moderation",
            ),
            (
                "pending_creator_contents",
                "Contenus créateurs en attente",
                "Des contenus créateurs attendent une revue.",
                counts.creator_contents_pending,
                "/creator-content?status=pending_review",
                "moderation",
            ),
            (
                "pending_reports",
                "Signalements citoyens",
                "Des signalements citoyens sont en attente de traitement.",
                counts.reports_pending,
                "/moderation?status=pending",
                "moderation",
            ),
            (
                "pending_partner_verifications",
                "Organisations à vérifier",
                "Des organisations partenaires attendent une vérification.",
                counts.organizations_pending_review,
                "/partners",
                "partners",
            ),
            (
                "open_partner_leads",
                "Leads partenaires ouverts",
                "Des prospects partenaires sont en cours de suivi.",
                counts.partner_leads_open,
                "/partner-leads",
                "partners",
            ),
        ]

        alerts: list[AdminActivityAlert] = [
            AdminActivityAlert(
                id=alert_id,
                label=label,
                description=description,
                count=count,
                severity=count_severity(count),
                href=href,
                category=category,  # type: ignore[arg-type]
            )
            for alert_id, label, description, count, href, category in alert_specs
        ]

        infra_issues = int(database == "error") + int(redis == "error")
        infra_unknown = int(database == "unknown") + int(redis == "unknown")
        if infra_issues > 0:
            alerts.append(
                AdminActivityAlert(
                    id="infrastructure_degraded",
                    label="Infrastructure dégradée",
                    description="La base de données ou Redis signale une erreur.",
                    count=infra_issues,
                    severity="critical",
                    href="/settings",
                    category="system",
                )
            )
        elif infra_unknown > 0:
            alerts.append(
                AdminActivityAlert(
                    id="infrastructure_unknown",
                    label="Infrastructure partielle",
                    description="Un composant système n'est pas joignable ou non configuré.",
                    count=infra_unknown,
                    severity="warning",
                    href="/settings",
                    category="system",
                )
            )

        return alerts

    def _build_attention(self, alerts: list[AdminActivityAlert]) -> AdminActivityAttentionSummary:
        actionable = [alert for alert in alerts if alert.severity != "healthy"]
        critical = sum(1 for alert in actionable if alert.severity == "critical")
        warning = sum(1 for alert in actionable if alert.severity == "warning")
        total = len(actionable)
        return AdminActivityAttentionSummary(
            critical=critical,
            warning=warning,
            total=total,
            healthy=total == 0,
        )

    def _build_sections(
        self,
        counts: AdminCockpitRawCounts,
        *,
        database: str,
        redis: str,
    ) -> AdminActivitySections:
        moderation_count = (
            counts.offers_pending
            + counts.events_pending
            + counts.creator_contents_pending
            + counts.reports_pending
        )
        partners_count = counts.organizations_pending_review + counts.partner_leads_open
        system_count = int(database != "ok") + int(redis != "ok")

        system_severity = (
            "critical"
            if system_count and (database == "error" or redis == "error")
            else count_severity(system_count)
        )
        return AdminActivitySections(
            moderation=AdminActivitySectionSummary(
                label="Modération",
                count=moderation_count,
                severity=aggregate_section_severity(moderation_count),
            ),
            partners=AdminActivitySectionSummary(
                label="Partenaires",
                count=partners_count,
                severity=aggregate_section_severity(partners_count),
            ),
            system=AdminActivitySectionSummary(
                label="Système",
                count=system_count,
                severity=system_severity,
            ),
        )
