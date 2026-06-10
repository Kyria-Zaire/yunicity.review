"""Local events business logic (TICKET-505)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.event_admin_constants import (
    EVENT_ADMIN_APPROVE_REASON,
    EventAdminAction,
)
from app.core.local_event_constants import (
    LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    MVP_LOCAL_EVENT_TYPES,
    LocalEventModerationStatus,
)
from app.core.local_event_workflow import assert_event_transition_allowed
from app.core.organization_constants import VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.models.local_event import EventInterest, LocalEvent
from app.models.organization import Organization
from app.models.user import User
from app.repositories.admin_local_event_repository import AdminLocalEventRepository
from app.repositories.local_event_repository import LocalEventRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.partner_repository import PartnerRepository
from app.schemas.admin_local_event import LocalEventAdminSummaryResponse
from app.schemas.local_event import (
    EventInterestToggleResponse,
    LocalEventCreateRequest,
    LocalEventListResponse,
    LocalEventManagementListResponse,
    LocalEventManagementResponse,
    LocalEventOrganizationSummary,
    LocalEventRejectRequest,
    LocalEventResponse,
    LocalEventUpdateRequest,
)
from app.services.feed_event_sync import FeedEventSyncService
from app.services.neighborhood_summary import neighborhood_summary_from_event
from app.services.organization_membership_service import OrganizationMembershipService

logger = logging.getLogger(__name__)


class LocalEventService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._events = LocalEventRepository(session)
        self._admin_events = AdminLocalEventRepository(session)
        self._orgs = OrganizationRepository(session)
        self._offers = PartnerOfferRepository(session)
        self._partners = PartnerRepository(session)
        self._membership = OrganizationMembershipService(session)

    async def list_public(
        self,
        user: User | None,
        *,
        city: str | None,
        page: int,
        page_size: int,
        organization_slug: str | None = None,
    ) -> LocalEventListResponse:
        page_size = min(max(page_size, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        offset = (max(page, 1) - 1) * page_size
        resolved_city = city or (user.city if user else None)
        now = datetime.now(UTC)
        rows = await self._events.list_public_for_city(
            city=resolved_city,
            limit=page_size,
            offset=offset,
            now=now,
            organization_slug=organization_slug,
        )
        interested_ids: set[uuid.UUID] = set()
        if user and rows:
            interested_ids = await self._events.interest_event_ids_for_user(
                user.id, [e.id for e in rows]
            )
        items = [self._to_response(e, interested_by_me=e.id in interested_ids) for e in rows]
        return LocalEventListResponse(
            items=items,
            total=len(items),
            page=page,
            page_size=page_size,
        )

    async def get_public(self, event_id: uuid.UUID, user: User | None) -> LocalEventResponse:
        event = await self._require_public_event(event_id)
        interested = False
        if user:
            row = await self._events.get_interest(user_id=user.id, event_id=event_id)
            interested = row is not None
        interest_count = await self._events.count_interests_for_event(event_id)
        return self._to_response(
            event,
            interested_by_me=interested,
            interest_count=interest_count,
        )

    async def list_saved(self, user: User, *, limit: int = 50) -> LocalEventListResponse:
        limit = min(max(limit, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        rows = await self._events.list_saved_for_user(user.id, limit=limit)
        return LocalEventListResponse(
            items=[self._to_response(e, interested_by_me=True) for e in rows],
            total=len(rows),
            page=1,
            page_size=limit,
        )

    async def list_for_partner(
        self,
        organization_id: uuid.UUID,
        *,
        upcoming_only: bool,
        limit: int,
        offset: int,
    ) -> LocalEventListResponse:
        limit = min(max(limit, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        offset = max(offset, 0)
        now = datetime.now(UTC)
        rows, total = await self._events.list_public_for_partner_org(
            organization_id=organization_id,
            upcoming_only=upcoming_only,
            limit=limit,
            offset=offset,
            now=now,
        )
        return LocalEventListResponse(
            items=[self._to_response(e) for e in rows],
            total=total,
            page=1,
            page_size=limit,
        )

    async def toggle_interest(self, user: User, event_id: uuid.UUID) -> EventInterestToggleResponse:
        event = await self._require_public_event(event_id)
        existing = await self._events.get_interest(user_id=user.id, event_id=event.id)
        if existing is not None:
            await self._events.delete_interest(existing)
            await self._session.commit()
            interest_count = await self._events.count_interests_for_event(event.id)
            return EventInterestToggleResponse(
                event_id=event.id,
                interested=False,
                interest_count=interest_count,
            )
        await self._events.add_interest(EventInterest(user_id=user.id, event_id=event.id))
        await self._session.commit()
        logger.info(
            "event_interest_added",
            extra={"user_id": str(user.id), "event_id": str(event.id)},
        )
        interest_count = await self._events.count_interests_for_event(event.id)
        return EventInterestToggleResponse(
            event_id=event.id,
            interested=True,
            interest_count=interest_count,
        )

    async def create_for_organization(
        self, actor: User, payload: LocalEventCreateRequest
    ) -> LocalEventManagementResponse:
        await self._membership.require_offer_manager(
            organization_id=payload.organization_id,
            user_id=actor.id,
        )
        await self._check_partner_status_gate(payload.organization_id)
        org = await self._require_organization(payload.organization_id)
        self._validate_event_type(payload.event_type)
        self._validate_dates(payload.starts_at, payload.ends_at)
        status = self._initial_moderation_status(org)
        event = LocalEvent(
            organization_id=org.id,
            created_by_user_id=actor.id,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            event_type=payload.event_type,
            city=payload.city.strip(),
            district=payload.district.strip() if payload.district else None,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            timezone=payload.timezone,
            location_name=payload.location_name.strip(),
            address=payload.address.strip() if payload.address else None,
            latitude=payload.latitude,
            longitude=payload.longitude,
            cover_image_url=payload.cover_image_url,
            moderation_status=status.value,
        )
        if status == LocalEventModerationStatus.APPROVED:
            event.moderated_at = datetime.now(UTC)
        created = await self._events.add(event)
        if status == LocalEventModerationStatus.APPROVED:
            await FeedEventSyncService(self._session).upsert_event_post(created, org)
        await self._session.commit()
        refreshed = await self._events.get_by_id(created.id)
        assert refreshed is not None
        return self._to_management_response(refreshed)

    async def update_for_organization(
        self,
        actor: User,
        event_id: uuid.UUID,
        payload: LocalEventUpdateRequest,
    ) -> LocalEventManagementResponse:
        event = await self._require_event(event_id)
        org_id = event.organization_id
        if org_id is None:
            raise AppError(
                status_code=400,
                code="EVENT_ORG_REQUIRED",
                detail="Organisation requise.",
            )
        await self._membership.require_offer_manager(
            organization_id=org_id,
            user_id=actor.id,
        )
        updates = payload.model_dump(exclude_unset=True)
        if "event_type" in updates:
            self._validate_event_type(updates.get("event_type"))
        starts = updates.get("starts_at", event.starts_at)
        ends = updates.get("ends_at", event.ends_at)
        self._validate_dates(starts, ends)
        await self._events.update_fields(event, fields=updates)
        await self._session.commit()
        refreshed = await self._require_event(event_id)
        return self._to_management_response(refreshed)

    async def submit_for_review(
        self, actor: User, event_id: uuid.UUID
    ) -> LocalEventManagementResponse:
        event = await self._require_event(event_id)
        org_id = event.organization_id
        if org_id is None:
            raise AppError(
                status_code=400,
                code="EVENT_ORG_REQUIRED",
                detail="Organisation requise.",
            )
        await self._membership.require_offer_manager(
            organization_id=org_id,
            user_id=actor.id,
        )
        org = await self._require_organization(org_id)
        target = self._initial_moderation_status(org)
        assert_event_transition_allowed(event.moderation_status, target)
        event.moderation_status = target.value
        if target == LocalEventModerationStatus.APPROVED:
            event.moderated_at = datetime.now(UTC)
            await FeedEventSyncService(self._session).upsert_event_post(event, org)
        await self._session.commit()
        return self._to_management_response(await self._require_event(event_id))

    async def list_my_events(
        self,
        actor: User,
        *,
        organization_id: uuid.UUID | None,
        page: int,
        page_size: int,
    ) -> LocalEventManagementListResponse:
        org_ids = await self._offers.list_managed_organization_ids(actor.id)
        if organization_id is not None:
            await self._membership.require_offer_manager(
                organization_id=organization_id,
                user_id=actor.id,
            )
            org_ids = [organization_id] if organization_id in org_ids else []
        page_size = min(page_size, LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        rows, total = await self._events.list_for_organization_ids(
            org_ids, page=page, page_size=page_size
        )
        return LocalEventManagementListResponse(
            items=[self._to_management_response(e) for e in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def approve_event(
        self, moderator: User, event_id: uuid.UUID
    ) -> LocalEventManagementResponse:
        event = await self._require_event(event_id)
        previous_status = event.moderation_status
        assert_event_transition_allowed(
            event.moderation_status, LocalEventModerationStatus.APPROVED
        )
        org = None
        if event.organization_id:
            org = await self._require_organization(event.organization_id)
        event.moderation_status = LocalEventModerationStatus.APPROVED.value
        event.moderated_by_user_id = moderator.id
        event.moderated_at = datetime.now(UTC)
        event.rejection_reason = None
        await self._record_event_admin_action(
            event_id=event.id,
            moderator=moderator,
            action=EventAdminAction.APPROVE,
            previous_status=previous_status,
            new_status=event.moderation_status,
            reason=EVENT_ADMIN_APPROVE_REASON,
        )
        await FeedEventSyncService(self._session).upsert_event_post(event, org)
        await self._session.commit()
        await self._notify_published(event)
        return self._to_management_response(await self._require_event(event_id))

    async def reject_event(
        self,
        moderator: User,
        event_id: uuid.UUID,
        payload: LocalEventRejectRequest,
    ) -> LocalEventManagementResponse:
        event = await self._require_event(event_id)
        previous_status = event.moderation_status
        reason = payload.reason.strip()
        assert_event_transition_allowed(
            event.moderation_status, LocalEventModerationStatus.REJECTED
        )
        event.moderation_status = LocalEventModerationStatus.REJECTED.value
        event.moderated_by_user_id = moderator.id
        event.moderated_at = datetime.now(UTC)
        event.rejection_reason = reason
        await self._record_event_admin_action(
            event_id=event.id,
            moderator=moderator,
            action=EventAdminAction.REJECT,
            previous_status=previous_status,
            new_status=event.moderation_status,
            reason=reason,
        )
        await FeedEventSyncService(self._session).deactivate_event_post(event.id)
        await self._session.commit()
        return self._to_management_response(await self._require_event(event_id))

    async def get_events_admin_summary(self, *, city: str) -> LocalEventAdminSummaryResponse:
        counts = await self._events.fetch_admin_summary(city=city)
        return LocalEventAdminSummaryResponse(
            city=city,
            generated_at=datetime.now(UTC),
            total=counts.total,
            pending_review=counts.pending_review,
            published=counts.published,
            upcoming_published=counts.upcoming_published,
            cancelled_or_archived=counts.cancelled_or_archived,
            rejected=counts.rejected,
        )

    async def list_admin(
        self,
        *,
        moderation_status: str | None,
        city: str | None,
        title_query: str | None,
        event_type: str | None,
        page: int,
        page_size: int,
    ) -> LocalEventManagementListResponse:
        page_size = min(page_size, LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        rows, total = await self._events.list_admin(
            moderation_status=moderation_status,
            city=city,
            title_query=title_query,
            event_type=event_type,
            page=page,
            page_size=page_size,
        )
        return LocalEventManagementListResponse(
            items=[self._to_management_response(e) for e in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def list_partner_events(
        self,
        *,
        slug: str,
        upcoming_only: bool = True,
        limit: int = 20,
        offset: int = 0,
    ) -> LocalEventListResponse:
        # TODO(debt): WEB-PARTNERS-05A — city hardcodé MVP, à paramétrer quand multi-ville
        profile = await self._partners.get_by_slug(
            city="Reims",
            slug=slug.strip().lower(),
        )
        if profile is None:
            raise AppError(
                status_code=404,
                code="PARTNER_NOT_FOUND",
                detail="Partenaire introuvable.",
            )
        try:
            status = PartnerStatus(profile.partner_status)
        except ValueError:
            raise AppError(
                status_code=404,
                code="PARTNER_NOT_FOUND",
                detail="Partenaire introuvable.",
            ) from None
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(
                status_code=404,
                code="PARTNER_NOT_FOUND",
                detail="Partenaire introuvable.",
            )

        limit = min(max(limit, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
        offset = max(offset, 0)
        now = datetime.now(UTC)
        rows, total = await self._events.list_public_for_partner_org(
            organization_id=profile.organization_id,
            upcoming_only=upcoming_only,
            limit=limit,
            offset=offset,
            now=now,
        )
        return LocalEventListResponse(
            items=[self._to_response(e) for e in rows],
            total=total,
            page=1,
            page_size=limit,
        )

    async def _check_partner_status_gate(self, organization_id: uuid.UUID) -> None:
        """Bloque signed/paused si l'org a un PartnerProfile."""
        profile = await self._partners.get_by_organization_id(organization_id)
        if profile is None:
            return
        try:
            status = PartnerStatus(profile.partner_status)
        except ValueError:
            logger.warning(
                "unknown_partner_status_gate",
                extra={"organization_id": str(organization_id), "status": profile.partner_status},
            )
            raise AppError(
                status_code=403,
                code="PARTNER_NOT_ACTIVE",
                detail="Ce partenaire n'est pas encore actif.",
            ) from None
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(
                status_code=403,
                code="PARTNER_NOT_ACTIVE",
                detail="Ce partenaire n'est pas encore actif.",
            )

    async def _notify_published(self, event: LocalEvent) -> None:
        if event.created_by_user_id is None:
            return
        from app.services.social_notification_service import SocialNotificationService

        await SocialNotificationService(self._session).notify_local_event_published(
            target_user_id=event.created_by_user_id,
            event_title=event.title,
            city=event.city,
        )

    async def _record_event_admin_action(
        self,
        *,
        event_id: uuid.UUID,
        moderator: User,
        action: EventAdminAction,
        previous_status: str,
        new_status: str,
        reason: str,
    ) -> None:
        await self._admin_events.record_admin_action(
            local_event_id=event_id,
            action=action.value,
            actor_user_id=moderator.id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
        )

    async def _require_event(self, event_id: uuid.UUID) -> LocalEvent:
        event = await self._events.get_by_id(event_id)
        if event is None:
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )
        return event

    async def _require_public_event(self, event_id: uuid.UUID) -> LocalEvent:
        event = await self._require_event(event_id)
        if event.moderation_status != LocalEventModerationStatus.APPROVED.value:
            raise AppError(
                status_code=404,
                code="EVENT_NOT_FOUND",
                detail="Événement introuvable.",
            )
        if event.is_cancelled:
            raise AppError(
                status_code=410,
                code="EVENT_CANCELLED",
                detail="Cet événement a été annulé.",
            )
        return event

    async def _require_organization(self, org_id: uuid.UUID) -> Organization:
        org = await self._orgs.get_by_id(org_id)
        if org is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organisation introuvable.",
            )
        return org

    @staticmethod
    def _initial_moderation_status(org: Organization) -> LocalEventModerationStatus:
        if org.verification_status == VerificationStatus.VERIFIED.value:
            return LocalEventModerationStatus.APPROVED
        return LocalEventModerationStatus.PENDING_REVIEW

    @staticmethod
    def _validate_event_type(event_type: str | None) -> None:
        if event_type is None:
            return
        if event_type not in MVP_LOCAL_EVENT_TYPES:
            raise AppError(
                status_code=422,
                code="EVENT_TYPE_INVALID",
                detail="Type d'événement non reconnu.",
            )

    @staticmethod
    def _validate_dates(starts_at: datetime, ends_at: datetime | None) -> None:
        if ends_at is not None and ends_at <= starts_at:
            raise AppError(
                status_code=422,
                code="EVENT_DATES_INVALID",
                detail="La date de fin doit être après le début.",
            )

    def _to_response(
        self,
        event: LocalEvent,
        *,
        interested_by_me: bool = False,
        interest_count: int = 0,
    ) -> LocalEventResponse:
        org = event.organization
        org_summary = None
        if org is not None:
            partner_profile = getattr(org, "partner_profile", None)
            is_partner = False
            p_status: str | None = None
            if partner_profile is not None:
                try:
                    status = PartnerStatus(partner_profile.partner_status)
                except ValueError:
                    status = None
                if status is not None:
                    is_partner = status in PUBLIC_PARTNER_STATUSES
                    p_status = status.value
            org_summary = LocalEventOrganizationSummary(
                id=org.id,
                slug=org.slug,
                name=org.name,
                city=org.city,
                logo_url=org.logo_url,
                is_verified=org.verified_at is not None,
                is_partner=is_partner,
                partner_status=p_status,
                created_at=org.created_at,
            )
        return LocalEventResponse(
            id=event.id,
            organization_id=event.organization_id,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            city=event.city,
            district=event.district,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            timezone=event.timezone,
            location_name=event.location_name,
            address=event.address,
            latitude=float(event.latitude) if event.latitude is not None else None,
            longitude=float(event.longitude) if event.longitude is not None else None,
            cover_image_url=event.cover_image_url,
            moderation_status=event.moderation_status,
            is_cancelled=event.is_cancelled,
            interested_by_me=interested_by_me,
            interest_count=interest_count,
            organization=org_summary,
            neighborhood_summary=neighborhood_summary_from_event(event),
            created_at=event.created_at,
        )

    def _to_management_response(self, event: LocalEvent) -> LocalEventManagementResponse:
        base = self._to_response(event)
        return LocalEventManagementResponse(
            **base.model_dump(),
            rejection_reason=event.rejection_reason,
        )
