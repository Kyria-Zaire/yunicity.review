"""Neighborhood citizen contributions business logic (FEATURE-QUARTIERS-V2 / Q2-S3-01+02)."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.neighborhood_v2_constants import (
    NEIGHBORHOOD_CONTRIBUTION_ANONYMOUS_LABELS,
    NEIGHBORHOOD_CONTRIBUTION_APPROVED_QUOTA_DAYS,
    NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH,
    NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH,
    NEIGHBORHOOD_CONTRIBUTION_IDENTITY_STORAGE,
    NEIGHBORHOOD_CONTRIBUTION_REJECTION_NOTE_MAX_LENGTH,
    NEIGHBORHOOD_CONTRIBUTION_SUBMIT_SUCCESS_MESSAGE,
    NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH,
    NEIGHBORHOOD_CONTRIBUTION_VERIFIED_SUFFIX,
    NeighborhoodContributionAnonymousGender,
    NeighborhoodContributionIdentityType,
    NeighborhoodContributionStatus,
)
from app.models.neighborhood_editorial import NeighborhoodContribution
from app.models.user import User
from app.models.user_profile import UserProfile
from app.repositories.neighborhood_contribution_repository import NeighborhoodContributionRepository
from app.repositories.neighborhood_repository import NeighborhoodRepository
from app.repositories.passport_repository import PassportRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.neighborhood import (
    NeighborhoodContributionMeListResponse,
    NeighborhoodContributionModerationResponse,
    NeighborhoodContributionRejectRequest,
    NeighborhoodContributionSubmitRequest,
    NeighborhoodContributionSubmitResponse,
)
from app.services.neighborhood_contribution_presenter import (
    to_me_item,
    to_moderation_response,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ContributionIdentitySnapshot:
    display_identity_type: str
    display_identity_label: str
    passport_verified_snapshot: bool


class NeighborhoodContributionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._contributions = NeighborhoodContributionRepository(session)
        self._neighborhoods = NeighborhoodRepository(session)
        self._profiles = ProfileRepository(session)
        self._passports = PassportRepository(session)

    async def submit_contribution(
        self,
        *,
        user: User,
        city: str,
        slug: str,
        payload: NeighborhoodContributionSubmitRequest,
    ) -> NeighborhoodContributionSubmitResponse:
        neighborhood = await self._neighborhoods.get_by_city_slug(
            city=city,
            slug=slug,
            active_only=True,
        )
        if neighborhood is None:
            raise AppError(
                status_code=404,
                code="NEIGHBORHOOD_NOT_FOUND",
                detail="Ce quartier n'existe pas encore.",
            )

        body = self._normalize_body(payload.body)
        self._validate_body_length(body)

        if not await self.can_submit_pending(user.id):
            raise AppError(
                status_code=409,
                code="CONTRIBUTION_PENDING_EXISTS",
                detail="Vous avez déjà un souvenir en attente de validation.",
            )

        if not await self.can_submit_quota(user.id, neighborhood.id):
            raise AppError(
                status_code=409,
                code="CONTRIBUTION_QUOTA_EXCEEDED",
                detail="Vous avez déjà partagé un souvenir publié sur ce quartier ce mois-ci.",
            )

        profile = await self._profiles.get_by_user_id(user.id)
        snapshot = await self.build_identity_snapshot(
            user=user,
            profile=profile,
            identity_type=payload.identity_type,
            anonymous_gender=payload.anonymous_gender,
        )

        title = self._normalize_title(payload.title)
        now = datetime.now(UTC)
        contribution = NeighborhoodContribution(
            neighborhood_id=neighborhood.id,
            author_user_id=user.id,
            title=title,
            body=body,
            status=NeighborhoodContributionStatus.PENDING.value,
            display_identity_type=snapshot.display_identity_type,
            display_identity_label=snapshot.display_identity_label,
            passport_verified_snapshot=snapshot.passport_verified_snapshot,
            submitted_at=now,
        )
        created = await self._contributions.create(contribution)
        await self._session.commit()
        await self._session.refresh(created)

        return NeighborhoodContributionSubmitResponse(
            id=created.id,
            status=NeighborhoodContributionStatus.PENDING.value,
            submitted_at=created.submitted_at,
            message=NEIGHBORHOOD_CONTRIBUTION_SUBMIT_SUCCESS_MESSAGE,
        )

    async def approve_contribution(
        self,
        *,
        admin: User,
        contribution_id: uuid.UUID,
    ) -> NeighborhoodContributionModerationResponse:
        contribution = await self._require_contribution(contribution_id)
        self._ensure_pending_review(contribution)
        now = datetime.now(UTC)
        contribution.status = NeighborhoodContributionStatus.APPROVED.value
        contribution.approved_at = now
        contribution.reviewed_at = now
        contribution.reviewed_by = admin.id
        contribution.rejection_reason_code = None
        contribution.rejection_note = None
        await self._session.flush()
        self._log_moderation_event(
            event="neighborhood_contribution_approved",
            contribution=contribution,
            reviewed_by_user_id=admin.id,
        )
        await self._session.commit()
        await self._session.refresh(contribution)
        return to_moderation_response(contribution)

    async def reject_contribution(
        self,
        *,
        admin: User,
        contribution_id: uuid.UUID,
        payload: NeighborhoodContributionRejectRequest,
    ) -> NeighborhoodContributionModerationResponse:
        contribution = await self._require_contribution(contribution_id)
        self._ensure_pending_review(contribution)
        note = self._normalize_rejection_note(payload.note)
        now = datetime.now(UTC)
        contribution.status = NeighborhoodContributionStatus.REJECTED.value
        contribution.approved_at = None
        contribution.reviewed_at = now
        contribution.reviewed_by = admin.id
        contribution.rejection_reason_code = payload.reason_code.value
        contribution.rejection_note = note
        await self._session.flush()
        self._log_moderation_event(
            event="neighborhood_contribution_rejected",
            contribution=contribution,
            reviewed_by_user_id=admin.id,
            reason_code=payload.reason_code.value,
        )
        await self._session.commit()
        await self._session.refresh(contribution)
        return to_moderation_response(contribution)

    async def list_user_contributions(self, user: User) -> NeighborhoodContributionMeListResponse:
        rows = await self._contributions.list_by_author(user.id)
        return NeighborhoodContributionMeListResponse(items=[to_me_item(row) for row in rows])

    async def can_submit_pending(self, author_user_id: uuid.UUID) -> bool:
        return not await self._contributions.author_has_pending(author_user_id)

    async def can_submit_quota(
        self,
        author_user_id: uuid.UUID,
        neighborhood_id: uuid.UUID,
        *,
        now: datetime | None = None,
    ) -> bool:
        now = now or datetime.now(UTC)
        latest = await self._contributions.get_latest_approved_for_author_hood(
            author_user_id=author_user_id,
            neighborhood_id=neighborhood_id,
        )
        if latest is None or latest.approved_at is None:
            return True
        approved_at = latest.approved_at
        if approved_at.tzinfo is None:
            approved_at = approved_at.replace(tzinfo=UTC)
        quota_end = approved_at + timedelta(days=NEIGHBORHOOD_CONTRIBUTION_APPROVED_QUOTA_DAYS)
        return now >= quota_end

    async def build_identity_snapshot(
        self,
        *,
        user: User,
        profile: UserProfile | None,
        identity_type: NeighborhoodContributionIdentityType,
        anonymous_gender: NeighborhoodContributionAnonymousGender | None,
    ) -> ContributionIdentitySnapshot:
        pseudo_label = self._resolve_pseudo_label(user, profile)
        storage_type = NEIGHBORHOOD_CONTRIBUTION_IDENTITY_STORAGE[identity_type]

        if identity_type == NeighborhoodContributionIdentityType.PSEUDO:
            return ContributionIdentitySnapshot(
                display_identity_type=storage_type,
                display_identity_label=pseudo_label,
                passport_verified_snapshot=False,
            )

        if identity_type == NeighborhoodContributionIdentityType.ANONYMOUS:
            gender = anonymous_gender or NeighborhoodContributionAnonymousGender.REMOIS
            return ContributionIdentitySnapshot(
                display_identity_type=storage_type,
                display_identity_label=NEIGHBORHOOD_CONTRIBUTION_ANONYMOUS_LABELS[gender],
                passport_verified_snapshot=False,
            )

        passport = await self._passports.get_active_for_user(user.id)
        if passport is None:
            raise AppError(
                status_code=422,
                code="CONTRIBUTION_VERIFIED_IDENTITY_UNAVAILABLE",
                detail="Le mode Citoyen vérifié nécessite un Passport actif.",
            )

        return ContributionIdentitySnapshot(
            display_identity_type=storage_type,
            display_identity_label=f"{pseudo_label} • {NEIGHBORHOOD_CONTRIBUTION_VERIFIED_SUFFIX}",
            passport_verified_snapshot=True,
        )

    @staticmethod
    def _resolve_pseudo_label(user: User, profile: UserProfile | None) -> str:
        if profile is not None and profile.display_name and profile.display_name.strip():
            return profile.display_name.strip()
        full_name = user.full_name.strip()
        if full_name:
            return full_name.split()[0]
        if profile is not None and profile.username.strip():
            return profile.username.strip()
        return "Rémois"

    async def _require_contribution(self, contribution_id: uuid.UUID) -> NeighborhoodContribution:
        contribution = await self._contributions.get_contribution_by_id(contribution_id)
        if contribution is None:
            raise AppError(
                status_code=404,
                code="CONTRIBUTION_NOT_FOUND",
                detail="Souvenir introuvable.",
            )
        return contribution

    @staticmethod
    def _ensure_pending_review(contribution: NeighborhoodContribution) -> None:
        if contribution.status != NeighborhoodContributionStatus.PENDING.value:
            raise AppError(
                status_code=409,
                code="CONTRIBUTION_ALREADY_REVIEWED",
                detail="Ce souvenir a déjà été modéré.",
            )

    @staticmethod
    def _normalize_rejection_note(note: str | None) -> str | None:
        if note is None:
            return None
        cleaned = note.strip()
        if not cleaned:
            return None
        if len(cleaned) > NEIGHBORHOOD_CONTRIBUTION_REJECTION_NOTE_MAX_LENGTH:
            raise AppError(
                status_code=400,
                code="CONTRIBUTION_REJECTION_NOTE_TOO_LONG",
                detail=(
                    "La note de refus ne peut pas dépasser "
                    f"{NEIGHBORHOOD_CONTRIBUTION_REJECTION_NOTE_MAX_LENGTH} caractères."
                ),
            )
        return cleaned

    @staticmethod
    def _log_moderation_event(
        *,
        event: str,
        contribution: NeighborhoodContribution,
        reviewed_by_user_id: uuid.UUID,
        reason_code: str | None = None,
    ) -> None:
        logger.info(
            event,
            extra={
                "contribution_id": str(contribution.id),
                "neighborhood_id": str(contribution.neighborhood_id),
                "author_user_id": str(contribution.author_user_id),
                "reviewed_by_user_id": str(reviewed_by_user_id),
                "reason_code": reason_code,
            },
        )

    @staticmethod
    def _normalize_body(body: str) -> str:
        return body.strip()

    @staticmethod
    def _normalize_title(title: str | None) -> str | None:
        if title is None:
            return None
        cleaned = title.strip()
        if not cleaned:
            return None
        if len(cleaned) > NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH:
            raise AppError(
                status_code=400,
                code="CONTRIBUTION_TITLE_TOO_LONG",
                detail=(
                    f"Le titre ne peut pas dépasser "
                    f"{NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH} caractères."
                ),
            )
        return cleaned

    @staticmethod
    def _validate_body_length(body: str) -> None:
        length = len(body)
        if length < NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH:
            raise AppError(
                status_code=400,
                code="CONTRIBUTION_BODY_TOO_SHORT",
                detail=(
                    f"Le souvenir doit contenir entre "
                    f"{NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH} et "
                    f"{NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH} caractères."
                ),
            )
        if length > NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH:
            raise AppError(
                status_code=400,
                code="CONTRIBUTION_BODY_TOO_LONG",
                detail=(
                    f"Le souvenir doit contenir entre "
                    f"{NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH} et "
                    f"{NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH} caractères."
                ),
            )
