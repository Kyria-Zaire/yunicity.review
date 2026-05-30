"use client";

import type { SubscriptionPlanCardState, SubscriptionBillingToggle } from "@yunicity/utils";
import {
  SUBSCRIPTION_PLAN_POPULAR_BADGE,
  SUBSCRIPTION_PRICE_PER_MONTH,
  formatSubscriptionPrice,
  resolveSubscriptionPlanPrice,
} from "@yunicity/utils";
import { Check, Gift, Minus } from "lucide-react";

type SubscriptionPlanCardProps = {
  card: SubscriptionPlanCardState;
  billingInterval: SubscriptionBillingToggle;
  onSelect: () => void;
  checkoutPending?: boolean;
};

export function SubscriptionPlanCard({
  card,
  billingInterval,
  onSelect,
  checkoutPending,
}: SubscriptionPlanCardProps) {
  const { plan, isCurrent, ctaLabel, ctaDisabled, ctaVariant } = card;
  const price = resolveSubscriptionPlanPrice(plan, billingInterval);

  const buttonClass =
    ctaVariant === "primary"
      ? "bg-yunicity-primary text-white hover:bg-yunicity-primary-hover"
      : ctaVariant === "outline"
        ? "border-2 border-yunicity-primary bg-white text-yunicity-primary hover:bg-[#EEF0FF]"
        : "border border-neutral-200 bg-neutral-100 text-neutral-500";

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
        plan.is_highlighted ? "border-yunicity-primary ring-1 ring-yunicity-primary/20" : "border-neutral-200/90"
      }`}
    >
      {plan.is_highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yunicity-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {SUBSCRIPTION_PLAN_POPULAR_BADGE}
        </span>
      ) : null}

      <p className="text-sm text-neutral-500">{plan.tagline}</p>
      <h3 className="mt-1 text-xl font-bold text-neutral-900">{plan.name}</h3>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-neutral-900">
          {formatSubscriptionPrice(price.displayCents)}
        </span>
        <span className="text-sm text-neutral-500">{price.suffix || SUBSCRIPTION_PRICE_PER_MONTH}</span>
      </p>

      <button
        type="button"
        disabled={ctaDisabled || checkoutPending}
        onClick={onSelect}
        className={`mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${buttonClass}`}
      >
        {checkoutPending ? "Redirection…" : ctaLabel}
      </button>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-start gap-2.5 text-sm">
            {feature.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            )}
            <span className={feature.included ? "text-neutral-800" : "text-neutral-400"}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {plan.code !== "free" ? (
        <p className="mt-5 flex items-center gap-2 text-xs text-neutral-500">
          <Gift className="h-4 w-4 text-violet-500" aria-hidden />
          Vous soutenez la communauté
        </p>
      ) : null}
    </article>
  );
}
