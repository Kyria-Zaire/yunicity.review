from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.subscription_constants import PAID_PLAN_CODES, MembershipStatus
from app.models.user_profile import UserProfile
from app.models.user_subscription import UserSubscription


class UserSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_for_user(self, user_id: uuid.UUID) -> UserSubscription | None:
        result = await self._session.execute(
            select(UserSubscription).where(UserSubscription.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def count_active_supporters(self) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(UserSubscription)
            .where(
                UserSubscription.plan_code.in_([code.value for code in PAID_PLAN_CODES]),
                UserSubscription.status == MembershipStatus.ACTIVE.value,
            )
        )
        return int(result.scalar_one() or 0)

    async def list_supporter_avatars(self, limit: int = 4) -> list[tuple[str | None, str]]:
        result = await self._session.execute(
            select(UserProfile.avatar_url, UserProfile.display_name)
            .join(UserSubscription, UserSubscription.user_id == UserProfile.user_id)
            .where(
                UserSubscription.plan_code.in_([code.value for code in PAID_PLAN_CODES]),
                UserSubscription.status == MembershipStatus.ACTIVE.value,
                UserProfile.display_name.is_not(None),
            )
            .order_by(UserSubscription.updated_at.desc())
            .limit(limit)
        )
        return [(row[0], row[1]) for row in result.all()]

    async def upsert_active(
        self,
        *,
        user_id: uuid.UUID,
        plan_code: str,
        billing_interval: str | None,
        stripe_customer_id: str | None = None,
        stripe_subscription_id: str | None = None,
    ) -> UserSubscription:
        existing = await self.get_for_user(user_id)
        if existing is not None:
            existing.plan_code = plan_code
            existing.billing_interval = billing_interval
            existing.status = MembershipStatus.ACTIVE.value
            existing.stripe_customer_id = stripe_customer_id or existing.stripe_customer_id
            existing.stripe_subscription_id = (
                stripe_subscription_id or existing.stripe_subscription_id
            )
            existing.canceled_at = None
            await self._session.flush()
            return existing

        row = UserSubscription(
            user_id=user_id,
            plan_code=plan_code,
            billing_interval=billing_interval,
            status=MembershipStatus.ACTIVE.value,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
        )
        self._session.add(row)
        await self._session.flush()
        return row
