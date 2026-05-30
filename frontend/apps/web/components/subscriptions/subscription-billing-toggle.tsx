"use client";

import type { SubscriptionBillingToggle } from "@yunicity/utils";
import {
  SUBSCRIPTION_BILLING_ANNUAL,
  SUBSCRIPTION_BILLING_ANNUAL_BADGE,
  SUBSCRIPTION_BILLING_ANNUAL_HINT,
  SUBSCRIPTION_BILLING_MONTHLY,
  SUBSCRIPTION_BILLING_MONTHLY_HINT,
} from "@yunicity/utils";

type SubscriptionBillingToggleProps = {
  value: SubscriptionBillingToggle;
  onChange: (value: SubscriptionBillingToggle) => void;
  annualDiscountPercent: number;
};

export function SubscriptionBillingToggleControl({
  value,
  onChange,
  annualDiscountPercent,
}: SubscriptionBillingToggleProps) {
  return (
    <div
      className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1"
      role="group"
      aria-label="Période de facturation"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-2 text-left transition ${
          value === "monthly"
            ? "bg-white text-yunicity-primary shadow-sm ring-1 ring-yunicity-primary/30"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        <span className="block text-sm font-semibold">{SUBSCRIPTION_BILLING_MONTHLY}</span>
        <span className="block text-[11px] text-neutral-500">{SUBSCRIPTION_BILLING_MONTHLY_HINT}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`rounded-full px-4 py-2 text-left transition ${
          value === "annual"
            ? "bg-white text-yunicity-primary shadow-sm ring-1 ring-yunicity-primary/30"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {SUBSCRIPTION_BILLING_ANNUAL}
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            -{annualDiscountPercent}%
          </span>
        </span>
        <span className="block text-[11px] text-neutral-500">
          {annualDiscountPercent > 0
            ? `Économisez ${Math.round(annualDiscountPercent / 10)} mois`
            : SUBSCRIPTION_BILLING_ANNUAL_HINT}
        </span>
      </button>
    </div>
  );
}
