"""Partner creator content business logic (WEB-PARTNERS-06A)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import OrganizationVisibility, VerificationStatus
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.partner_creator_content_constants import PartnerCreatorContentStatus
from app.core.partner_creator_content_workflow import (
    assert_creator_content_transition_allowed,
    assert_partner_can_edit_creator_content,
    is_creator_content_published,
)
from app.models.organization import Organization
from app.models.partner_creator_content import PartnerCreatorContent
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.partner_creator_content_repository import PartnerCreatorContentRepository
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.partner_repository import PartnerRepository
from app.schemas.admin_partner_creator_content import PartnerCreatorContentRejectRequest
from app.schemas.partner_creator_content_management import (
    PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX,
    PartnerCreatorContentCreateRequest,
    PartnerCreatorContentManagementListResponse,
    PartnerCreatorContentManagementResponse,
    PartnerCreatorContentOrganizationSummary,
    PartnerCreatorContentUpdateRequest,
)
from app.services.feed_creator_content_sync import FeedCreatorContentSyncService
from app.services.organization_membership_service import OrganizationMembershipService

logger = logging.getLogger(__name__)


class PartnerCreatorContentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._contents = PartnerCreatorContentRepository(session)
        self._offers = PartnerOfferRepository(session)
        self._orgs = OrganizationRepository(session)
        self._partners = PartnerRepository(session)
        self._membership = OrganizationMembershipService(session)

    async def create_draft(
        self,
        actor: User,
        payload: PartnerCreatorContentCreateRequest,
    ) -> PartnerCreatorContentManagementResponse:
        org = await self._require_verified_organization(payload.organization_id)
        await self._membership.require_offer_manager(
            organization_id=org.id,
            user_id=actor.id,
        )
        await self._check_partner_status_gate(org.id)
        content = PartnerCreatorContent(
            organization_id=org.id,
            title=payload.title.strip(),
            body=payload.body.strip() if payload.body else None,
            media_url=payload.media_url.strip() if payload.media_url else None,
            status=PartnerCreatorContentStatus.DRAFT,
            is_active=False,
            created_by_user_id=actor.id,
        )
        created = await self._contents.create(content)
        await self._session.commit()
        return await self._to_management_response(await self._require_content(created.id))

    async def update_draft(
        self,
        actor: User,
        content_id: uuid.UUID,
        payload: PartnerCreatorContentUpdateRequest,
    ) -> PartnerCreatorContentManagementResponse:
        content = await self._require_content(content_id)
        await self._membership.require_offer_manager(
            organization_id=content.organization_id,
            user_id=actor.id,
        )
        assert_partner_can_edit_creator_content(content.status)
        updates = payload.model_dump(exclude_unset=True)
        if "title" in updates and updates["title"] is not None:
            updates["title"] = updates["title"].strip()
        if "body" in updates and updates["body"] is not None:
            updates["body"] = updates["body"].strip()
        if "media_url" in updates and updates["media_url"] is not None:
            updates["media_url"] = updates["media_url"].strip()
        await self._contents.update_fields(content, fields=updates)
        await self._session.commit()
        return await self._to_management_response(await self._require_content(content_id))

    async def submit_for_review(
        self,
        actor: User,
        content_id: uuid.UUID,
    ) -> PartnerCreatorContentManagementResponse:
        content = await self._require_content(content_id)
        await self._membership.require_offer_manager(
            organization_id=content.organization_id,
            user_id=actor.id,
        )
        assert_creator_content_transition_allowed(
            content.status,
            PartnerCreatorContentStatus.PENDING_REVIEW,
        )
        content.status = PartnerCreatorContentStatus.PENDING_REVIEW
        content.rejection_reason = None
        await self._session.commit()
        return await self._to_management_response(await self._require_content(content_id))

    async def list_my_contents(
        self,
        actor: User,
        *,
        organization_id: uuid.UUID | None,
        status: str | None,
        page: int,
        page_size: int,
    ) -> PartnerCreatorContentManagementListResponse:
        org_ids = await self._offers.list_managed_organization_ids(actor.id)
        if organization_id is not None:
            await self._membership.require_offer_manager(
                organization_id=organization_id,
                user_id=actor.id,
            )
            org_ids = [organization_id] if organization_id in org_ids else []
        page_size = min(page_size, PARTNER_CREATOR_CONTENT_LIST_PAGE_SIZE_MAX)
        rows, total = await self._contents.list_for_organization_ids(
            org_ids,
            status=status,
            page=page,
            page_size=page_size,
        )
        return PartnerCreatorContentManagementListResponse(
            items=[await self._to_management_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def approve_content(
        self,
        moderator: User,
        content_id: uuid.UUID,
    ) -> PartnerCreatorContentManagementResponse:
        content = await self._require_content(content_id)
        org = await self._require_verified_organization(content.organization_id)
        self._transition_content(
            content,
            PartnerCreatorContentStatus.PUBLISHED,
            moderator=moderator,
            clear_rejection=True,
        )
        org.visibility = OrganizationVisibility.PUBLIC
        await FeedCreatorContentSyncService(self._session).upsert_creator_content_post(
            content,
            org,
        )
        await self._session.commit()
        return await self._to_management_response(await self._require_content(content_id))

    async def reject_content(
        self,
        moderator: User,
        content_id: uuid.UUID,
        payload: PartnerCreatorContentRejectRequest,
    ) -> PartnerCreatorContentManagementResponse:
        content = await self._require_content(content_id)
        await self._require_verified_organization(content.organization_id)
        self._transition_content(
            content,
            PartnerCreatorContentStatus.REJECTED,
            moderator=moderator,
            rejection_reason=payload.reason.strip(),
        )
        await FeedCreatorContentSyncService(self._session).deactivate_creator_content_post(
            content.id
        )
        await self._session.commit()
        return await self._to_management_response(await self._require_content(content_id))

    async def archive_content(
        self,
        moderator: User,
        content_id: uuid.UUID,
    ) -> PartnerCreatorContentManagementResponse:
        content = await self._require_content(content_id)
        await self._require_verified_organization(content.organization_id)
        self._transition_content(
            content,
            PartnerCreatorContentStatus.ARCHIVED,
            moderator=moderator,
            clear_rejection=True,
        )
        await FeedCreatorContentSyncService(self._session).deactivate_creator_content_post(
            content.id
        )
        await self._session.commit()
        return await self._to_management_response(await self._require_content(content_id))

    def _transition_content(
        self,
        content: PartnerCreatorContent,
        target: PartnerCreatorContentStatus,
        *,
        moderator: User | None = None,
        rejection_reason: str | None = None,
        clear_rejection: bool = False,
    ) -> None:
        assert_creator_content_transition_allowed(content.status, target)
        content.status = target
        content.is_active = is_creator_content_published(target)
        if moderator is not None:
            content.moderated_by_user_id = moderator.id
            content.moderated_at = datetime.now(UTC)
        if target == PartnerCreatorContentStatus.REJECTED:
            content.rejection_reason = rejection_reason
        elif clear_rejection:
            content.rejection_reason = None

    async def _require_content(self, content_id: uuid.UUID) -> PartnerCreatorContent:
        content = await self._contents.get_by_id(content_id)
        if content is None:
            raise AppError(
                status_code=404,
                code="CREATOR_CONTENT_NOT_FOUND",
                detail="Contenu créateur introuvable.",
            )
        return content

    async def _require_verified_organization(self, organization_id: uuid.UUID) -> Organization:
        org = await self._orgs.get_by_id(organization_id)
        if org is None:
            raise AppError(
                status_code=404,
                code="ORGANIZATION_NOT_FOUND",
                detail="Organisation introuvable.",
            )
        if org.verification_status != VerificationStatus.VERIFIED.value:
            raise AppError(
                status_code=422,
                code="ORGANIZATION_NOT_VERIFIED",
                detail="Le contenu créateur est réservé aux organisations vérifiées.",
            )
        return org

    async def _check_partner_status_gate(self, organization_id: uuid.UUID) -> None:
        profile = await self._partners.get_by_organization_id(organization_id)
        if profile is None:
            return
        try:
            partner_status = PartnerStatus(profile.partner_status)
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
        if partner_status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(
                status_code=403,
                code="PARTNER_NOT_ACTIVE",
                detail="Ce partenaire n'est pas encore actif.",
            )

    async def _to_management_response(
        self,
        content: PartnerCreatorContent,
    ) -> PartnerCreatorContentManagementResponse:
        org = content.organization
        if org is None:
            org = await self._orgs.get_by_id(content.organization_id)
        assert org is not None
        status = (
            content.status
            if isinstance(content.status, PartnerCreatorContentStatus)
            else PartnerCreatorContentStatus(content.status)
        )
        return PartnerCreatorContentManagementResponse(
            id=content.id,
            organization_id=content.organization_id,
            organization=PartnerCreatorContentOrganizationSummary(
                id=org.id,
                slug=org.slug,
                name=org.name,
                city=org.city,
            ),
            title=content.title,
            body=content.body,
            media_url=content.media_url,
            status=status,
            is_active=content.is_active,
            rejection_reason=content.rejection_reason,
            created_at=content.created_at,
            updated_at=content.updated_at,
        )
