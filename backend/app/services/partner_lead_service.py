"""Partner lead CRM business logic."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.organization_constants import (
    ONBOARDING_STEP_INITIAL,
    ORGANIZATION_TYPES,
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.organization_slug import pick_available_organization_slug
from app.core.partner_lead_constants import (
    PARTNER_LEAD_LIST_PAGE_SIZE_DEFAULT,
    PARTNER_LEAD_LIST_PAGE_SIZE_MAX,
    PARTNER_LEAD_SOURCES,
    PARTNER_LEAD_STATUSES,
    PartnerLeadSource,
    PartnerLeadStatus,
)
from app.models.organization import Organization, OrganizationMember, OrganizationVerification
from app.models.partner_lead import PartnerLead
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.partner_lead_repository import PartnerLeadRepository
from app.repositories.user_repository import UserRepository
from app.schemas.partner_lead import (
    PartnerLeadConvertRequest,
    PartnerLeadCreateRequest,
    PartnerLeadImportDuplicateRow,
    PartnerLeadImportInvalidRow,
    PartnerLeadImportNormalizedRow,
    PartnerLeadImportPreviewRequest,
    PartnerLeadImportPreviewResponse,
    PartnerLeadImportRow,
    PartnerLeadListResponse,
    PartnerLeadResponse,
    PartnerLeadUpdateRequest,
)


class PartnerLeadService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._leads = PartnerLeadRepository(session)
        self._orgs = OrganizationRepository(session)
        self._users = UserRepository(session)

    async def create_lead(
        self,
        actor: User,
        payload: PartnerLeadCreateRequest,
    ) -> PartnerLeadResponse:
        duplicate = await self._leads.find_duplicate(
            name=payload.name,
            city=payload.city,
            phone=payload.phone,
        )
        if duplicate is not None:
            raise AppError(
                status_code=409,
                code="DUPLICATE_PARTNER_LEAD",
                detail="Un lead similaire existe déjà (nom + ville + téléphone).",
            )

        lead = self._build_lead_from_create(payload, created_by_user_id=actor.id)
        await self._leads.create(lead)
        await self._session.commit()
        await self._session.refresh(lead)
        return self._to_response(lead)

    async def list_leads(
        self,
        *,
        status: str | None,
        source: str | None,
        city: str | None,
        page: int,
        page_size: int | None,
    ) -> PartnerLeadListResponse:
        safe_page = max(page, 1)
        safe_size = page_size or PARTNER_LEAD_LIST_PAGE_SIZE_DEFAULT
        safe_size = min(max(safe_size, 1), PARTNER_LEAD_LIST_PAGE_SIZE_MAX)

        if status is not None and status not in PARTNER_LEAD_STATUSES:
            raise AppError(
                status_code=422,
                code="INVALID_PARTNER_LEAD_STATUS",
                detail="Statut de lead invalide.",
            )
        if source is not None and source not in PARTNER_LEAD_SOURCES:
            raise AppError(
                status_code=422,
                code="INVALID_PARTNER_LEAD_SOURCE",
                detail="Source de lead invalide.",
            )

        items, total = await self._leads.list_leads(
            status=status,
            source=source,
            city=city,
            page=safe_page,
            page_size=safe_size,
        )
        return PartnerLeadListResponse(
            items=[self._to_response(lead) for lead in items],
            total=total,
            page=safe_page,
            page_size=safe_size,
        )

    async def get_lead(self, lead_id: uuid.UUID) -> PartnerLeadResponse:
        lead = await self._require_lead(lead_id)
        return self._to_response(lead)

    async def update_lead(
        self,
        actor: User,
        lead_id: uuid.UUID,
        payload: PartnerLeadUpdateRequest,
    ) -> PartnerLeadResponse:
        lead = await self._require_lead(lead_id)
        fields = payload.model_dump(exclude_unset=True)
        if not fields:
            return self._to_response(lead)

        if "status" in fields and fields["status"] is not None:
            status_value = fields["status"]
            status_str = (
                status_value.value
                if isinstance(status_value, PartnerLeadStatus)
                else str(status_value)
            )
            if status_str not in PARTNER_LEAD_STATUSES:
                raise AppError(
                    status_code=422,
                    code="INVALID_PARTNER_LEAD_STATUS",
                    detail="Statut de lead invalide.",
                )
            fields["status"] = status_str

        fields["updated_by_user_id"] = actor.id
        await self._leads.update(lead, fields=fields)
        await self._session.commit()
        await self._session.refresh(lead)
        return self._to_response(lead)

    async def convert_lead(
        self,
        actor: User,
        lead_id: uuid.UUID,
        payload: PartnerLeadConvertRequest,
    ) -> PartnerLeadResponse:
        lead = await self._require_lead(lead_id)
        if await self._leads.is_converted(lead):
            raise AppError(
                status_code=409,
                code="PARTNER_LEAD_ALREADY_CONVERTED",
                detail="Ce lead a déjà été converti.",
            )

        owner = await self._users.get_by_id(payload.owner_user_id)
        if owner is None or not owner.is_active:
            raise AppError(
                status_code=404,
                code="OWNER_USER_NOT_FOUND",
                detail="Utilisateur propriétaire introuvable.",
            )

        now = datetime.now(UTC)
        organization: Organization

        if payload.organization_id is not None:
            existing = await self._orgs.get_by_id(payload.organization_id)
            if existing is None:
                raise AppError(
                    status_code=404,
                    code="ORGANIZATION_NOT_FOUND",
                    detail="Organization introuvable.",
                )
            organization = existing
        else:
            if not lead.city:
                raise AppError(
                    status_code=422,
                    code="PARTNER_LEAD_MISSING_CITY",
                    detail="Ville requise pour créer une organization.",
                )
            organization = await self._create_organization_from_lead(
                lead=lead,
                owner_user_id=owner.id,
                now=now,
            )

        await self._ensure_owner_membership(
            organization=organization,
            owner_user_id=owner.id,
            now=now,
        )

        lead.status = PartnerLeadStatus.CONVERTED
        lead.converted_organization_id = organization.id
        lead.converted_at = now
        lead.converted_by_user_id = actor.id
        lead.updated_by_user_id = actor.id
        await self._session.flush()
        await self._session.commit()
        await self._session.refresh(lead)

        return self._to_response(lead)

    async def import_preview(
        self,
        payload: PartnerLeadImportPreviewRequest,
    ) -> PartnerLeadImportPreviewResponse:
        normalized: list[PartnerLeadImportNormalizedRow] = []
        invalid: list[PartnerLeadImportInvalidRow] = []
        duplicates: list[PartnerLeadImportDuplicateRow] = []
        seen_keys: dict[str, int] = {}

        db_keys: list[tuple[str, str, str]] = []
        pending_normalized: list[tuple[int, PartnerLeadImportNormalizedRow, str]] = []

        for index, row in enumerate(payload.rows):
            result = self._normalize_import_row(index, row)
            if isinstance(result, PartnerLeadImportInvalidRow):
                invalid.append(result)
                continue
            normalized_row, dup_key = result
            normalized.append(normalized_row)
            pending_normalized.append((index, normalized_row, dup_key))
            db_keys.append(
                PartnerLead.normalize_identity_key(
                    name=normalized_row.name,
                    city=normalized_row.city,
                    phone=normalized_row.phone,
                )
            )

            if dup_key in seen_keys:
                duplicates.append(
                    PartnerLeadImportDuplicateRow(
                        row_index=index,
                        duplicate_key=dup_key,
                        reason="duplicate_in_batch",
                    )
                )
            else:
                seen_keys[dup_key] = index

        existing = await self._leads.find_duplicates_by_keys(db_keys)
        existing_keys = {
            PartnerLead.normalize_identity_key(
                name=lead.name,
                city=lead.city,
                phone=lead.phone,
            )
            for lead in existing
        }
        for index, _row, dup_key in pending_normalized:
            name_key, city_key, phone_key = dup_key.split("|", 2)
            key_tuple = (name_key, city_key, phone_key)
            if key_tuple in existing_keys:
                duplicates.append(
                    PartnerLeadImportDuplicateRow(
                        row_index=index,
                        duplicate_key=dup_key,
                        reason="duplicate_in_database",
                    )
                )

        return PartnerLeadImportPreviewResponse(
            normalized=normalized,
            invalid=invalid,
            duplicates=duplicates,
            total_rows=len(payload.rows),
        )

    async def _create_organization_from_lead(
        self,
        *,
        lead: PartnerLead,
        owner_user_id: uuid.UUID,
        now: datetime,
    ) -> Organization:
        org_type = self._resolve_organization_type(lead.organization_type)
        slug = await pick_available_organization_slug(
            self._orgs.slug_exists,
            name=lead.name,
            city=lead.city or "",
        )
        social_links: dict[str, Any] = {}
        if lead.instagram:
            social_links["instagram"] = lead.instagram.strip()

        organization = Organization(
            slug=slug,
            name=lead.name.strip(),
            description=None,
            type=org_type,
            category=None,
            city=(lead.city or "").strip(),
            address=lead.address,
            phone=lead.phone,
            website=lead.website,
            social_links=social_links,
            verification_status=VerificationStatus.PENDING,
            visibility=OrganizationVisibility.PRIVATE,
            onboarding_completed=False,
            onboarding_step=ONBOARDING_STEP_INITIAL,
            created_by_user_id=owner_user_id,
        )
        owner = OrganizationMember(
            user_id=owner_user_id,
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
            metadata_={"source": "partner_lead_convert", "partner_lead_id": str(lead.id)},
            created_at=now,
        )
        await self._orgs.create_organization(
            organization=organization,
            owner_member=owner,
            verification=verification,
        )
        return organization

    async def _ensure_owner_membership(
        self,
        *,
        organization: Organization,
        owner_user_id: uuid.UUID,
        now: datetime,
    ) -> None:
        existing = await self._orgs.get_active_membership(
            organization_id=organization.id,
            user_id=owner_user_id,
        )
        if existing is not None:
            if existing.role == OrganizationMemberRole.OWNER.value:
                return
            raise AppError(
                status_code=409,
                code="MEMBER_ALREADY_EXISTS",
                detail="L'utilisateur est déjà membre avec un autre rôle.",
            )
        owner = OrganizationMember(
            organization_id=organization.id,
            user_id=owner_user_id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
            joined_at=now,
        )
        self._session.add(owner)
        await self._session.flush()

    async def _require_lead(self, lead_id: uuid.UUID) -> PartnerLead:
        lead = await self._leads.get_by_id(lead_id)
        if lead is None:
            raise AppError(
                status_code=404,
                code="PARTNER_LEAD_NOT_FOUND",
                detail="Lead partenaire introuvable.",
            )
        return lead

    def _build_lead_from_create(
        self,
        payload: PartnerLeadCreateRequest,
        *,
        created_by_user_id: uuid.UUID,
    ) -> PartnerLead:
        name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
            name=payload.name,
            city=payload.city,
            phone=payload.phone,
        )
        org_type_value = payload.organization_type.value if payload.organization_type else None
        return PartnerLead(
            name=payload.name.strip(),
            organization_type=org_type_value,
            contact_name=payload.contact_name,
            email=str(payload.email) if payload.email else None,
            phone=payload.phone,
            website=payload.website,
            instagram=payload.instagram,
            city=payload.city,
            address=payload.address,
            source=payload.source.value,
            status=payload.status.value,
            interested_passport=payload.interested_passport,
            interested_events=payload.interested_events,
            interested_creator_program=payload.interested_creator_program,
            interested_offers=payload.interested_offers,
            interested_business_passport=payload.interested_business_passport,
            tags=payload.tags,
            notes=payload.notes,
            internal_rating=payload.internal_rating,
            last_contacted_at=payload.last_contacted_at,
            next_followup_at=payload.next_followup_at,
            metadata_=payload.metadata,
            name_normalized=name_key,
            city_normalized=city_key,
            phone_normalized=phone_key,
            created_by_user_id=created_by_user_id,
            updated_by_user_id=created_by_user_id,
        )

    def _normalize_import_row(
        self,
        index: int,
        row: PartnerLeadImportRow,
    ) -> tuple[PartnerLeadImportNormalizedRow, str] | PartnerLeadImportInvalidRow:
        errors: list[str] = []
        raw = row.model_dump()

        name = (row.name or "").strip()
        if len(name) < 2:
            errors.append("name_required")

        source_str = (row.source or PartnerLeadSource.PHYSICAL_PROSPECTING.value).strip().lower()
        if source_str not in PARTNER_LEAD_SOURCES:
            errors.append("invalid_source")
            source = PartnerLeadSource.PHYSICAL_PROSPECTING
        else:
            source = PartnerLeadSource(source_str)

        status_str = (row.status or PartnerLeadStatus.NEW.value).strip().lower()
        if status_str not in PARTNER_LEAD_STATUSES:
            errors.append("invalid_status")
            status = PartnerLeadStatus.NEW
        else:
            status = PartnerLeadStatus(status_str)

        org_type: OrganizationType | None = None
        if row.organization_type:
            type_str = row.organization_type.strip().lower()
            if type_str not in ORGANIZATION_TYPES:
                errors.append("invalid_organization_type")
            else:
                org_type = OrganizationType(type_str)

        email: str | None = None
        if row.email:
            email_candidate = row.email.strip()
            if "@" not in email_candidate:
                errors.append("invalid_email")
            else:
                email = email_candidate

        tags: list[str] = []
        if row.tags:
            try:
                from app.schemas.partner_lead import _validate_tags

                tags = _validate_tags(row.tags)
            except ValueError:
                errors.append("invalid_tags")

        if errors:
            return PartnerLeadImportInvalidRow(row_index=index, errors=errors, raw=raw)

        city = (row.city or "").strip() or None
        phone = (row.phone or "").strip() or None
        name_key, city_key, phone_key = PartnerLead.normalize_identity_key(
            name=name,
            city=city,
            phone=phone,
        )
        dup_key = f"{name_key}|{city_key}|{phone_key}"

        normalized = PartnerLeadImportNormalizedRow(
            row_index=index,
            name=name,
            city=city,
            phone=phone,
            source=source,
            status=status,
            email=email,
            organization_type=org_type,
            contact_name=(row.contact_name or "").strip() or None,
            website=(row.website or "").strip() or None,
            instagram=(row.instagram or "").strip() or None,
            address=(row.address or "").strip() or None,
            tags=tags,
        )
        return normalized, dup_key

    def _resolve_organization_type(self, value: str | None) -> OrganizationType:
        if value is None:
            return OrganizationType.OTHER
        normalized = value.strip().lower()
        if normalized not in ORGANIZATION_TYPES:
            return OrganizationType.OTHER
        return OrganizationType(normalized)

    def _to_response(self, lead: PartnerLead) -> PartnerLeadResponse:
        org_type: OrganizationType | None = None
        if lead.organization_type:
            try:
                org_type = OrganizationType(lead.organization_type)
            except ValueError:
                org_type = OrganizationType.OTHER

        return PartnerLeadResponse(
            id=lead.id,
            name=lead.name,
            organization_type=org_type,
            contact_name=lead.contact_name,
            email=lead.email,
            phone=lead.phone,
            website=lead.website,
            instagram=lead.instagram,
            city=lead.city,
            address=lead.address,
            source=PartnerLeadSource(lead.source),
            status=PartnerLeadStatus(lead.status),
            interested_passport=lead.interested_passport,
            interested_events=lead.interested_events,
            interested_creator_program=lead.interested_creator_program,
            interested_offers=lead.interested_offers,
            interested_business_passport=lead.interested_business_passport,
            tags=[str(tag) for tag in lead.tags],
            notes=lead.notes,
            internal_rating=lead.internal_rating,
            last_contacted_at=lead.last_contacted_at,
            next_followup_at=lead.next_followup_at,
            converted_organization_id=lead.converted_organization_id,
            converted_at=lead.converted_at,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
        )
