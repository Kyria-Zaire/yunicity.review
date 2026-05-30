"""Citizen membership catalog and checkout (WEB-SUBSCRIPTIONS-01)."""

from __future__ import annotations

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.subscription_constants import (
    ANNUAL_DISCOUNT_PERCENT,
    PAID_PLAN_CODES,
    PLAN_DEFINITIONS,
    MembershipBillingInterval,
    MembershipPlanCode,
    MembershipStatus,
    annual_price_cents,
    monthly_equivalent_from_annual_cents,
)
from app.models.user import User
from app.repositories.user_subscription_repository import UserSubscriptionRepository
from app.schemas.subscription import (
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionCheckoutStatus,
    SubscriptionCommunityStatsResponse,
    SubscriptionMeResponse,
    SubscriptionPlanFeatureResponse,
    SubscriptionPlanPriceResponse,
    SubscriptionPlanResponse,
    SubscriptionPlansResponse,
    SubscriptionSupporterAvatarResponse,
)


class SubscriptionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._subscriptions = UserSubscriptionRepository(session)
        self._settings = get_settings()

    def _checkout_enabled(self) -> bool:
        return bool(
            self._settings.stripe_secret_key
            and self._settings.stripe_checkout_success_url
            and self._settings.stripe_checkout_cancel_url
        )

    def _stripe_price_id(
        self,
        plan_code: MembershipPlanCode,
        interval: MembershipBillingInterval,
    ) -> str | None:
        mapping = {
            (MembershipPlanCode.PLUS, MembershipBillingInterval.MONTHLY): (
                self._settings.stripe_price_plus_monthly
            ),
            (MembershipPlanCode.PLUS, MembershipBillingInterval.ANNUAL): (
                self._settings.stripe_price_plus_annual
            ),
            (MembershipPlanCode.PREMIUM, MembershipBillingInterval.MONTHLY): (
                self._settings.stripe_price_premium_monthly
            ),
            (MembershipPlanCode.PREMIUM, MembershipBillingInterval.ANNUAL): (
                self._settings.stripe_price_premium_annual
            ),
        }
        return mapping.get((plan_code, interval))

    async def list_plans(self) -> SubscriptionPlansResponse:
        plans: list[SubscriptionPlanResponse] = []
        for definition in PLAN_DEFINITIONS:
            monthly = definition["monthly_price_cents"]
            discount = definition["annual_discount_percent"]
            annual = annual_price_cents(monthly, discount)
            plans.append(
                SubscriptionPlanResponse(
                    code=definition["code"],
                    name=definition["name"],
                    tagline=definition["tagline"],
                    display_order=definition["display_order"],
                    is_highlighted=definition["is_highlighted"],
                    price=SubscriptionPlanPriceResponse(
                        monthly_cents=monthly,
                        annual_cents=annual,
                        annual_monthly_equivalent_cents=monthly_equivalent_from_annual_cents(
                            annual
                        ),
                    ),
                    features=[
                        SubscriptionPlanFeatureResponse(
                            key=item["key"],
                            label=item["label"],
                            included=item["included"],
                        )
                        for item in definition["features"]
                    ],
                )
            )
        return SubscriptionPlansResponse(
            plans=plans,
            annual_discount_percent=ANNUAL_DISCOUNT_PERCENT,
            checkout_enabled=self._checkout_enabled(),
        )

    async def get_me(self, user: User) -> SubscriptionMeResponse:
        row = await self._subscriptions.get_for_user(user.id)
        if row is None or row.plan_code == MembershipPlanCode.FREE.value:
            return SubscriptionMeResponse(
                plan_code=MembershipPlanCode.FREE,
                billing_interval=None,
                status=MembershipStatus.ACTIVE,
                is_paid=False,
                current_period_end=None,
                can_upgrade=True,
            )

        plan_code = MembershipPlanCode(row.plan_code)
        status = MembershipStatus(row.status)
        is_paid = plan_code in PAID_PLAN_CODES and status == MembershipStatus.ACTIVE
        billing = (
            MembershipBillingInterval(row.billing_interval)
            if row.billing_interval
            else None
        )
        can_upgrade = plan_code == MembershipPlanCode.PLUS and is_paid

        return SubscriptionMeResponse(
            plan_code=plan_code,
            billing_interval=billing,
            status=status,
            is_paid=is_paid,
            current_period_end=row.current_period_end,
            can_upgrade=can_upgrade,
        )

    async def community_stats(self) -> SubscriptionCommunityStatsResponse:
        count = await self._subscriptions.count_active_supporters()
        avatars_raw = await self._subscriptions.list_supporter_avatars(limit=4)
        avatars = [
            SubscriptionSupporterAvatarResponse(
                display_name=name,
                avatar_url=url,
            )
            for url, name in avatars_raw
            if name
        ]
        return SubscriptionCommunityStatsResponse(supporter_count=count, avatars=avatars)

    async def create_checkout(
        self,
        user: User,
        payload: SubscriptionCheckoutRequest,
    ) -> SubscriptionCheckoutResponse:
        if payload.plan_code == MembershipPlanCode.FREE:
            raise AppError(
                status_code=400,
                code="INVALID_PLAN",
                detail="L'offre gratuite ne nécessite pas de paiement.",
            )

        if not self._checkout_enabled():
            return SubscriptionCheckoutResponse(
                status=SubscriptionCheckoutStatus.UNAVAILABLE,
                message=(
                    "Le paiement en ligne n'est pas encore activé sur cet environnement. "
                    "Revenez bientôt ou contactez l'équipe Yunicity."
                ),
            )

        price_id = self._stripe_price_id(payload.plan_code, payload.billing_interval)
        if not price_id:
            return SubscriptionCheckoutResponse(
                status=SubscriptionCheckoutStatus.UNAVAILABLE,
                message=(
                    "Cette formule n'est pas encore configurée côté paiement. "
                    "Merci de réessayer plus tard."
                ),
            )

        secret = self._settings.stripe_secret_key
        if secret is None:
            return SubscriptionCheckoutResponse(
                status=SubscriptionCheckoutStatus.UNAVAILABLE,
                message="Paiement indisponible.",
            )

        form: dict[str, str] = {
            "mode": "subscription",
            "success_url": self._settings.stripe_checkout_success_url or "",
            "cancel_url": self._settings.stripe_checkout_cancel_url or "",
            "client_reference_id": str(user.id),
            "customer_email": user.email,
            "line_items[0][price]": price_id,
            "line_items[0][quantity]": "1",
            "metadata[plan_code]": payload.plan_code.value,
            "metadata[billing_interval]": payload.billing_interval.value,
            "metadata[user_id]": str(user.id),
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.stripe.com/v1/checkout/sessions",
                auth=(secret, ""),
                data=form,
            )

        if response.status_code >= 400:
            raise AppError(
                status_code=502,
                code="CHECKOUT_PROVIDER_ERROR",
                detail="Impossible de démarrer le paiement pour le moment.",
            )

        data = response.json()
        url = data.get("url")
        if not url:
            raise AppError(
                status_code=502,
                code="CHECKOUT_PROVIDER_ERROR",
                detail="Réponse de paiement invalide.",
            )

        return SubscriptionCheckoutResponse(
            status=SubscriptionCheckoutStatus.REDIRECT,
            checkout_url=url,
        )
