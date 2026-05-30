"use client";

import type { MembershipPlanCode } from "@yunicity/types";
import {
  SUBSCRIPTION_CHECKOUT_UNAVAILABLE_TITLE,
  SUBSCRIPTION_ERROR,
  SUBSCRIPTION_LOADING,
  SUBSCRIPTION_PAGE_SUBTITLE,
  SUBSCRIPTION_PAGE_TITLE,
  SUBSCRIPTION_RETRY,
  buildSubscriptionPlanCardState,
  canCheckoutPlan,
  type SubscriptionBillingToggle,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

import { SubscriptionAppShell } from "@/components/subscriptions/subscription-app-shell";
import { SubscriptionBillingToggleControl } from "@/components/subscriptions/subscription-billing-toggle";
import { SubscriptionFaq } from "@/components/subscriptions/subscription-faq";
import { SubscriptionLeftRail } from "@/components/subscriptions/subscription-left-rail";
import { SubscriptionPlanCard } from "@/components/subscriptions/subscription-plan-card";
import { SubscriptionRightRail } from "@/components/subscriptions/subscription-right-rail";
import { SubscriptionTrustRow } from "@/components/subscriptions/subscription-trust-row";
import { useSubscriptionPortalContext } from "@/hooks/use-subscription-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function SubscriptionScreen() {
  const api = useYunicityApi();
  const ctx = useSubscriptionPortalContext();
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingToggle>("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlanCode | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const planCards = useMemo(() => {
    if (!ctx.plans) return [];
    return [...ctx.plans.plans]
      .sort((a, b) => a.display_order - b.display_order)
      .map((plan) => buildSubscriptionPlanCardState(plan, ctx.me));
  }, [ctx.me, ctx.plans]);

  async function handleSelectPlan(planCode: MembershipPlanCode) {
    if (planCode === "free") return;
    if (!ctx.plans || !canCheckoutPlan(planCode, ctx.me, ctx.plans.checkout_enabled)) {
      setCheckoutMessage(
        "Le paiement en ligne n'est pas encore activé. Vous pouvez continuer à utiliser l'offre gratuite.",
      );
      return;
    }

    setCheckoutPlan(planCode);
    setCheckoutMessage(null);
    try {
      const result = await api.startSubscriptionCheckout({
        plan_code: planCode,
        billing_interval: billingInterval,
      });
      if (result.status === "redirect" && result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      setCheckoutMessage(
        result.message ??
          "Le paiement n'est pas disponible pour le moment. Réessayez plus tard.",
      );
    } catch {
      setCheckoutMessage("Impossible de démarrer le paiement pour le moment.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  if (ctx.loading) {
    return (
      <SubscriptionAppShell>
        <SubscriptionLeftRail />
        <p className="flex-1 py-16 text-center text-sm text-neutral-500" role="status">
          {SUBSCRIPTION_LOADING}
        </p>
      </SubscriptionAppShell>
    );
  }

  if (ctx.error || !ctx.plans) {
    return (
      <SubscriptionAppShell>
        <SubscriptionLeftRail />
        <div className="flex-1 py-16 text-center">
          <p className="text-sm text-neutral-600">{ctx.error ?? SUBSCRIPTION_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-5 py-2 text-sm font-semibold text-white"
          >
            {SUBSCRIPTION_RETRY}
          </button>
        </div>
      </SubscriptionAppShell>
    );
  }

  return (
    <SubscriptionAppShell rightRail={<SubscriptionRightRail community={ctx.community} />}>
      <SubscriptionLeftRail />

      <div className="min-w-0 flex-1" id="subscription-plans">
        <header className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {SUBSCRIPTION_PAGE_TITLE}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
            {SUBSCRIPTION_PAGE_SUBTITLE}
          </p>
        </header>

        <div className="mt-6">
          <SubscriptionBillingToggleControl
            value={billingInterval}
            onChange={setBillingInterval}
            annualDiscountPercent={ctx.plans.annual_discount_percent}
          />
        </div>

        {checkoutMessage ? (
          <div
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            <p className="font-semibold">{SUBSCRIPTION_CHECKOUT_UNAVAILABLE_TITLE}</p>
            <p className="mt-1">{checkoutMessage}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {planCards.map((card) => (
            <SubscriptionPlanCard
              key={card.plan.code}
              card={card}
              billingInterval={billingInterval}
              checkoutPending={checkoutPlan === card.plan.code}
              onSelect={() => void handleSelectPlan(card.plan.code)}
            />
          ))}
        </div>

        <div className="mt-10">
          <SubscriptionTrustRow />
        </div>

        <div className="mt-8">
          <SubscriptionFaq />
        </div>

        <div className="mt-8 2xl:hidden">
          <SubscriptionRightRail community={ctx.community} />
        </div>
      </div>
    </SubscriptionAppShell>
  );
}
