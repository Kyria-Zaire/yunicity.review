"""Admin passport ops read persistence (ADMIN-03A)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.passport_constants import OfferRedemptionStatus, PassportStatus
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.passport_admin_action import PassportAdminAction
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.admin_passport import AdminPassportSearchMode


@dataclass(frozen=True, slots=True)
class AdminPassportListRow:
    passport: Passport
    user: User
    profile: UserProfile | None
    tier: PassportTier


@dataclass(frozen=True, slots=True)
class AdminPassportActionRow:
    action: PassportAdminAction
    actor: User | None
    actor_profile: UserProfile | None


ListPassportRow = tuple[Passport, User, UserProfile, PassportTier]
ListPassportSelect = Select[ListPassportRow]


class AdminPassportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _list_base_stmt(self, *, city: str) -> ListPassportSelect:
        return (
            select(Passport, User, UserProfile, PassportTier)
            .join(User, Passport.user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .join(PassportTier, Passport.tier_id == PassportTier.id)
            .where(Passport.city == city)
        )

    def _apply_status_filter(
        self,
        stmt: ListPassportSelect,
        status: str | None,
    ) -> ListPassportSelect:
        if status is None:
            return stmt.where(
                Passport.status.in_(
                    (
                        PassportStatus.ACTIVE.value,
                        PassportStatus.SUSPENDED.value,
                    )
                )
            )
        return stmt.where(Passport.status == status)

    async def list_passports(
        self,
        *,
        city: str,
        status: str | None,
        search_mode: AdminPassportSearchMode | None,
        q: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminPassportListRow], int]:
        stmt = self._list_base_stmt(city=city)
        stmt = self._apply_status_filter(stmt, status)

        if q is not None and search_mode is not None:
            stmt = self._apply_search(stmt, search_mode=search_mode, q=q)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one())

        page_stmt = (
            stmt.order_by(Passport.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(page_stmt)
        rows = [
            AdminPassportListRow(
                passport=row[0],
                user=row[1],
                profile=row[2] if isinstance(row[2], UserProfile) else None,
                tier=row[3],
            )
            for row in result.all()
        ]
        return rows, total

    async def count_by_passport_number(self, *, city: str, passport_number: str) -> int:
        stmt = (
            select(func.count())
            .select_from(Passport)
            .where(
                Passport.city == city,
                Passport.passport_number == passport_number,
                Passport.status.in_(
                    (
                        PassportStatus.ACTIVE.value,
                        PassportStatus.SUSPENDED.value,
                    )
                ),
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    def _apply_search(
        self,
        stmt: ListPassportSelect,
        *,
        search_mode: AdminPassportSearchMode,
        q: str,
    ) -> ListPassportSelect:
        if search_mode == AdminPassportSearchMode.EMAIL:
            return stmt.where(func.lower(User.email) == q.lower())
        if search_mode == AdminPassportSearchMode.PASSPORT_NUMBER:
            return stmt.where(Passport.passport_number == q)
        if search_mode == AdminPassportSearchMode.DISPLAY_NAME:
            pattern = f"%{q}%"
            return stmt.where(
                or_(
                    UserProfile.display_name.ilike(pattern),
                    User.full_name.ilike(pattern),
                )
            )
        if search_mode == AdminPassportSearchMode.QR_FRAGMENT:
            return stmt.where(Passport.qr_token.contains(q))
        return stmt

    async def get_passport_detail(self, passport_id: uuid.UUID) -> AdminPassportListRow | None:
        stmt = (
            select(Passport, User, UserProfile, PassportTier)
            .join(User, Passport.user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .join(PassportTier, Passport.tier_id == PassportTier.id)
            .where(Passport.id == passport_id)
        )
        result = await self._session.execute(stmt)
        row = result.one_or_none()
        if row is None:
            return None
        return AdminPassportListRow(
            passport=row[0],
            user=row[1],
            profile=row[2] if isinstance(row[2], UserProfile) else None,
            tier=row[3],
        )

    async def count_redemptions_completed(self, passport_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(PassportOfferRedemption)
            .where(
                PassportOfferRedemption.passport_id == passport_id,
                PassportOfferRedemption.status == OfferRedemptionStatus.COMPLETED.value,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def list_stamps(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[PassportStamp], int]:
        filters = [PassportStamp.passport_id == passport_id]
        count_stmt = select(func.count()).select_from(PassportStamp).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PassportStamp)
            .options(selectinload(PassportStamp.organization))
            .where(*filters)
            .order_by(PassportStamp.stamped_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def list_redemptions(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[PassportOfferRedemption], int]:
        filters = [PassportOfferRedemption.passport_id == passport_id]
        count_stmt = select(func.count()).select_from(PassportOfferRedemption).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PassportOfferRedemption)
            .options(
                selectinload(PassportOfferRedemption.offer).selectinload(PartnerOffer.organization)
            )
            .where(*filters)
            .order_by(PassportOfferRedemption.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def update_passport(self, passport: Passport) -> None:
        await self._session.flush()

    async def record_admin_action(
        self,
        *,
        passport_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str,
        actor_user_id: uuid.UUID,
        previous_status: str,
        new_status: str,
        reason: str,
        metadata: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> PassportAdminAction:
        entry = PassportAdminAction(
            passport_id=passport_id,
            user_id=user_id,
            action=action,
            actor_user_id=actor_user_id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata_=metadata,
            created_at=created_at or datetime.now(UTC),
        )
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list_admin_actions(
        self,
        *,
        passport_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminPassportActionRow], int]:
        filters = [PassportAdminAction.passport_id == passport_id]

        count_stmt = select(func.count()).select_from(PassportAdminAction).where(*filters)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(PassportAdminAction, User, UserProfile)
            .outerjoin(User, PassportAdminAction.actor_user_id == User.id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(*filters)
            .order_by(PassportAdminAction.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        rows = [
            AdminPassportActionRow(
                action=row[0],
                actor=row[1] if isinstance(row[1], User) else None,
                actor_profile=row[2] if isinstance(row[2], UserProfile) else None,
            )
            for row in result.all()
        ]
        return rows, total
