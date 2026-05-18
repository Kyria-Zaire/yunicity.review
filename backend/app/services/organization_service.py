"""Organization business logic."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import (
    ALLOWED_VERIFICATION_TRANSITIONS,
    MAX_PENDING_ORGANIZATIONS_PER_USER,
    ONBOARDING_STEP_INITIAL,
    ORGANIZATION_DESCRIPTION_MAX_LENGTH,
    ORGANIZATION_TYPES,
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.organization_slug import (
    is_valid_organization_slug_format,
    normalize_organization_slug,
    pick_available_organization_slug,
)
from app.models.organization import Organization, OrganizationMember, OrganizationVerification
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationCreateResponse,
    OrganizationMeItem,
    OrganizationMeListResponse,
    OrganizationMemberResponse,
    OrganizationMembersListResponse,
    OrganizationMemberViewResponse,
    OrganizationPublicResponse,
    OrganizationReviewRequest,
    OrganizationUpdateRequest,
)
from app.services.organization_membership_service import OrganizationMembershipService


class OrganizationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._orgs = OrganizationRepository(session)
        self._membership = OrganizationMembershipService(session)

    async def create_request(
        self,
        user: User,
        payload: OrganizationCreateRequest,
    ) -> OrganizationCreateResponse:
        if payload.type.value not in ORGANIZATION_TYPES:
            raise AppError(
                status_code=422,
                code="INVALID_ORGANIZATION_TYPE",
                detail="Type d'organization invalide.",
            )

        pending_count = await self._orgs.count_pending_for_user(user.id)
        if pending_count >= MAX_PENDING_ORGANIZATIONS_PER_USER:
            raise AppError(
                status_code=409,
                code="PENDING_ORGANIZATION_LIMIT",
                detail="Nombre maximum de demandes en attente atteint.",
            )

        duplicate = await self._orgs.find_duplicate(
            name=payload.name,
            city=payload.city,
            address=payload.address,
        )
        if duplicate is not None:
            raise AppError(
                status_code=409,
                code="DUPLICATE_ORGANIZATION",
                detail="Une organization similaire existe déjà.",
            )

        slug = await pick_available_organization_slug(
            self._orgs.slug_exists,
            name=payload.name,
            city=payload.city,
        )

        now = datetime.now(UTC)
        organization = Organization(
            slug=slug,
            name=payload.name.strip(),
            description=payload.description,
            type=payload.type,
            category=payload.category,
            city=payload.city.strip(),
            address=payload.address,
            postal_code=payload.postal_code,
            phone=payload.phone,
            website=payload.website,
            verification_status=VerificationStatus.PENDING,
            visibility=OrganizationVisibility.PRIVATE,
            onboarding_completed=False,
            onboarding_step=ONBOARDING_STEP_INITIAL,
            created_by_user_id=user.id,
        )
        owner = OrganizationMember(
            user_id=user.id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
            joined_at=now,
        )
        verification = OrganizationVerification(
            previous_status=None,
            new_status=VerificationStatus.PENDING,
            method=None,
            reviewed_by_user_id=None,
            reason=None,
            metadata_={"source": "create_request"},
            created_at=now,
        )

        await self._orgs.create_organization(
            organization=organization,
            owner_member=owner,
            verification=verification,
        )
        await self._session.commit()
        await self._session.refresh(organization)

        return OrganizationCreateResponse(
            id=organization.id,
            slug=organization.slug,
            name=organization.name,
            verification_status=organization.verification_status,
            visibility=organization.visibility,
        )

    async def list_my_organizations(self, user: User) -> OrganizationMeListResponse:
        rows = await self._orgs.list_for_active_member(user.id)
        items = [
            OrganizationMeItem(
                id=org.id,
                slug=org.slug,
                name=org.name,
                type=org.type,
                city=org.city,
                verification_status=org.verification_status,
                visibility=org.visibility,
                onboarding_completed=org.onboarding_completed,
                member_role=member.role,
                member_status=member.status,
            )
            for org, member in rows
        ]
        return OrganizationMeListResponse(items=items)

    async def get_by_slug(
        self,
        slug: str,
        *,
        viewer: User | None,
    ) -> OrganizationPublicResponse | OrganizationMemberViewResponse:
        normalized = normalize_organization_slug(slug)
        if not is_valid_organization_slug_format(normalized):
            raise self._not_found()

        org = await self._orgs.get_by_slug(normalized)
        if org is None:
            raise self._not_found()

        member = None
        if viewer is not None:
            member = await self._membership.get_active_membership(
                organization_id=org.id,
                user_id=viewer.id,
            )

        if (
            org.verification_status == VerificationStatus.VERIFIED
            and org.visibility == OrganizationVisibility.PUBLIC
        ):
            return self._to_public(org)

        if member is not None and self._membership.is_admin_or_owner(member):
            return self._to_member_view(org)

        raise self._not_found()

    async def list_members(
        self,
        organization_id: uuid.UUID,
        viewer: User,
    ) -> OrganizationMembersListResponse:
        await self._membership.require_admin_or_owner(
            organization_id=organization_id,
            user_id=viewer.id,
        )
        org = await self._get_org_or_404(organization_id)
        members = await self._orgs.list_members(org.id)
        include_email = True
        items: list[OrganizationMemberResponse] = []
        for member in members:
            email = member.user.email if include_email and member.user else None
            items.append(
                OrganizationMemberResponse(
                    id=member.id,
                    user_id=member.user_id,
                    role=member.role,
                    status=member.status,
                    email=email,
                )
            )
        return OrganizationMembersListResponse(items=items)

    async def update_organization(
        self,
        organization_id: uuid.UUID,
        user: User,
        payload: OrganizationUpdateRequest,
    ) -> OrganizationMemberViewResponse:
        await self._membership.require_admin_or_owner(
            organization_id=organization_id,
            user_id=user.id,
        )
        org = await self._get_org_or_404(organization_id)
        updates = payload.model_dump(exclude_unset=True)

        if "description" in updates and updates["description"] is not None:
            if len(updates["description"]) > ORGANIZATION_DESCRIPTION_MAX_LENGTH:
                raise AppError(
                    status_code=422,
                    code="DESCRIPTION_TOO_LONG",
                    detail="Description trop longue.",
                )

        if "website" in updates and updates["website"]:
            if not updates["website"].startswith("https://"):
                raise AppError(
                    status_code=422,
                    code="INVALID_URL",
                    detail="Le site web doit utiliser HTTPS.",
                )

        await self._orgs.update_organization(org, fields=updates)
        await self._session.commit()
        await self._session.refresh(org)
        return self._to_member_view(org)

    async def review_organization(
        self,
        organization_id: uuid.UUID,
        reviewer: User,
        payload: OrganizationReviewRequest,
    ) -> OrganizationMemberViewResponse:
        org = await self._get_org_or_404(organization_id)
        current = org.verification_status
        target = payload.decision

        allowed = ALLOWED_VERIFICATION_TRANSITIONS.get(current, frozenset())
        if target not in allowed:
            raise AppError(
                status_code=422,
                code="INVALID_VERIFICATION_TRANSITION",
                detail=f"Transition {current.value} → {target.value} non autorisée.",
            )

        method = payload.method.value if payload.method else None
        await self._orgs.add_verification_event(
            organization_id=org.id,
            previous_status=current,
            new_status=target,
            method=method,
            reviewed_by_user_id=reviewer.id,
            reason=payload.reason,
        )

        org.verification_status = target
        if target == VerificationStatus.VERIFIED:
            org.verified_at = datetime.now(UTC)
            org.verified_by_user_id = reviewer.id
            org.verification_method = payload.method
            org.rejection_reason = None
        elif target == VerificationStatus.REJECTED:
            org.rejection_reason = payload.reason
        elif target == VerificationStatus.SUSPENDED:
            pass

        await self._orgs.update_organization(
            org,
            fields={
                "verification_status": org.verification_status,
                "verified_at": org.verified_at,
                "verified_by_user_id": org.verified_by_user_id,
                "verification_method": org.verification_method,
                "rejection_reason": org.rejection_reason,
            },
        )
        await self._session.commit()
        await self._session.refresh(org)
        return self._to_member_view(org)

    async def _get_org_or_404(self, organization_id: uuid.UUID) -> Organization:
        org = await self._orgs.get_by_id(organization_id)
        if org is None:
            raise self._not_found()
        return org

    def _not_found(self) -> AppError:
        return AppError(
            status_code=404,
            code="ORGANIZATION_NOT_FOUND",
            detail="Organization introuvable.",
        )

    def _to_public(self, org: Organization) -> OrganizationPublicResponse:
        return OrganizationPublicResponse(
            slug=org.slug,
            name=org.name,
            description=org.description,
            type=org.type,
            category=org.category,
            city=org.city,
            address=org.address,
            postal_code=org.postal_code,
            website=org.website,
            phone=org.phone,
            social_links=dict(org.social_links),
            logo_url=org.logo_url,
            banner_url=org.banner_url,
        )

    def _to_member_view(self, org: Organization) -> OrganizationMemberViewResponse:
        return OrganizationMemberViewResponse(
            id=org.id,
            slug=org.slug,
            name=org.name,
            description=org.description,
            type=org.type,
            category=org.category,
            city=org.city,
            address=org.address,
            postal_code=org.postal_code,
            website=org.website,
            phone=org.phone,
            social_links=dict(org.social_links),
            verification_status=org.verification_status,
            visibility=org.visibility,
            onboarding_step=org.onboarding_step,
            onboarding_completed=org.onboarding_completed,
        )
