"""Admin platform configuration snapshot service (ADMIN-SETTINGS-01B)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.passport_constants import DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT
from app.core.passport_level_rules import (
    GOLD_REPUTATION_THRESHOLD,
    SILVER_REPUTATION_THRESHOLD,
)
from app.core.passport_stamp_qr import STAMP_QR_DEFAULT_EXPIRES_MINUTES
from app.core.pilot_constants import (
    CREATOR_CONTENT_EDITORIAL_PILOT_GOAL,
    EVENTS_AGENDA_PILOT_GOAL,
    MODERATION_ATTENTION_THRESHOLD,
    OFFERS_CATALOG_PILOT_GOAL,
    PARTNER_LEAD_PILOT_QUALIFIED_GOAL,
    PASSPORT_OPS_PILOT_GOAL,
    PILOT_STATUS_ACTIVE,
)
from app.core.subscription_constants import PLAN_DEFINITIONS
from app.db.seeds.auth_rbac import ROLE_DEFINITIONS
from app.db.session import check_database
from app.integrations.redis import check_redis
from app.models.passport import PassportTier
from app.models.user import User
from app.schemas.admin_cockpit import DEFAULT_COCKPIT_CITY
from app.schemas.admin_platform_config import (
    AdminPlatformConfigBadgeThresholds,
    AdminPlatformConfigBusiness,
    AdminPlatformConfigGeneral,
    AdminPlatformConfigMembershipPlan,
    AdminPlatformConfigModeration,
    AdminPlatformConfigNotifications,
    AdminPlatformConfigPartners,
    AdminPlatformConfigPassport,
    AdminPlatformConfigPassportTier,
    AdminPlatformConfigPilotGoals,
    AdminPlatformConfigPlatformRole,
    AdminPlatformConfigReadiness,
    AdminPlatformConfigResponse,
    AdminPlatformConfigSystem,
    AdminPlatformConfigViewer,
)
from app.services.rbac_service import RbacService

ENABLED_MODULES: tuple[str, ...] = (
    "cockpit",
    "analytics",
    "partners",
    "passport_ops",
    "partner_offers",
    "local_events",
    "creator_content",
    "moderation",
    "partner_leads",
    "staff",
    "partner_scan",
)

COMING_SOON_ITEMS: tuple[str, ...] = (
    "maintenance_mode",
    "admin_email_digest",
    "platform_settings_editing",
    "session_analytics",
    "commissions_cpc_cpm",
    "admin_notification_alerts",
)


class AdminPlatformConfigService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_snapshot(self, *, viewer: User) -> AdminPlatformConfigResponse:
        settings = get_settings()
        db_status = await check_database()
        redis_status = await check_redis()
        degraded = any(status == "error" for status in (db_status, redis_status))
        readiness = AdminPlatformConfigReadiness(
            status="degraded" if degraded else "ready",
            database=db_status,
            redis=redis_status,
        )
        rbac_context = await RbacService(self._session).get_user_rbac_context(viewer.id)
        tiers = await self._list_passport_tiers()

        return AdminPlatformConfigResponse(
            generated_at=datetime.now(UTC),
            read_only=True,
            general=AdminPlatformConfigGeneral(
                app_name=settings.app_name,
                pilot_city=DEFAULT_COCKPIT_CITY,
                pilot_status=PILOT_STATUS_ACTIVE,
                pilot_goals=AdminPlatformConfigPilotGoals(
                    active_passports=PASSPORT_OPS_PILOT_GOAL,
                    published_offers=OFFERS_CATALOG_PILOT_GOAL,
                    upcoming_events=EVENTS_AGENDA_PILOT_GOAL,
                    approved_creator_contents=CREATOR_CONTENT_EDITORIAL_PILOT_GOAL,
                    qualified_leads=PARTNER_LEAD_PILOT_QUALIFIED_GOAL,
                ),
            ),
            passport=AdminPlatformConfigPassport(
                tiers=tiers,
                badge_thresholds=AdminPlatformConfigBadgeThresholds(
                    silver_reputation=SILVER_REPUTATION_THRESHOLD,
                    gold_reputation=GOLD_REPUTATION_THRESHOLD,
                ),
                stamp_qr_expires_minutes=STAMP_QR_DEFAULT_EXPIRES_MINUTES,
                default_max_redemptions_per_passport=DEFAULT_MAX_REDEMPTIONS_PER_PASSPORT,
                passport_stamp_feed_events_enabled=settings.passport_stamp_feed_events,
            ),
            partners=AdminPlatformConfigPartners(
                supported_statuses=[status.value for status in PartnerStatus],
                public_visible_statuses=[status.value for status in PUBLIC_PARTNER_STATUSES],
                organization_manual_verification=True,
            ),
            moderation=AdminPlatformConfigModeration(
                events_auto_approve_when_org_verified=True,
                creator_content_requires_review=True,
                offers_require_review=True,
                attention_threshold=MODERATION_ATTENTION_THRESHOLD,
            ),
            notifications=AdminPlatformConfigNotifications(
                expo_push_enabled=settings.expo_push_enabled,
                email_system_available=False,
            ),
            system=AdminPlatformConfigSystem(
                environment=settings.app_env,
                service_name="yunicity-api",
                readiness=readiness,
                platform_roles=[
                    AdminPlatformConfigPlatformRole(key=key, name=name)
                    for key, (name, _) in ROLE_DEFINITIONS.items()
                    if key in {"MODERATOR", "CITY_ADMIN", "SUPER_ADMIN"}
                ],
                rate_limits_mode="configured_in_code",
            ),
            business=AdminPlatformConfigBusiness(
                membership_plans=[
                    AdminPlatformConfigMembershipPlan(
                        code=plan["code"].value,
                        name=plan["name"],
                        monthly_price_cents=plan["monthly_price_cents"],
                    )
                    for plan in PLAN_DEFINITIONS
                ],
                stripe_configured=bool(settings.stripe_secret_key),
            ),
            enabled_modules=list(ENABLED_MODULES),
            coming_soon=list(COMING_SOON_ITEMS),
            viewer=AdminPlatformConfigViewer(
                roles=sorted(rbac_context.roles),
                permissions=sorted(rbac_context.permissions),
            ),
        )

    async def _list_passport_tiers(self) -> list[AdminPlatformConfigPassportTier]:
        result = await self._session.execute(
            select(PassportTier).order_by(PassportTier.display_order.asc())
        )
        rows = result.scalars().all()
        return [
            AdminPlatformConfigPassportTier(
                code=str(tier.code),
                name=tier.name,
                display_order=tier.display_order,
                is_active=tier.is_active,
                is_publicly_visible=tier.is_publicly_visible,
            )
            for tier in rows
        ]
