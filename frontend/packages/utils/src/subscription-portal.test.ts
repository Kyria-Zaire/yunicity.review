import { describe, expect, it } from "vitest";

import {
  buildSubscriptionPlanCardState,
  canCheckoutPlan,
  formatSubscriptionPrice,
  resolveSubscriptionPlanPrice,
} from "./subscription-portal";
import type { SubscriptionMe, SubscriptionPlan } from "@yunicity/types";

const plusPlan: SubscriptionPlan = {
  code: "plus",
  name: "Yunicity Plus",
  tagline: "Pour vivre plus intensément",
  display_order: 1,
  is_highlighted: true,
  price: {
    monthly_cents: 599,
    annual_cents: 5750,
    annual_monthly_equivalent_cents: 479,
    currency: "EUR",
  },
  features: [],
};

const freeMe: SubscriptionMe = {
  plan_code: "free",
  billing_interval: null,
  status: "active",
  is_paid: false,
  current_period_end: null,
  can_upgrade: true,
};

describe("formatSubscriptionPrice", () => {
  it("formats euros for fr-FR", () => {
    expect(formatSubscriptionPrice(599)).toBe("5,99€");
    expect(formatSubscriptionPrice(0)).toBe("0€");
  });
});

describe("resolveSubscriptionPlanPrice", () => {
  it("uses annual equivalent when annual toggle", () => {
    const resolved = resolveSubscriptionPlanPrice(plusPlan, "annual");
    expect(resolved.displayCents).toBe(479);
  });
});

describe("buildSubscriptionPlanCardState", () => {
  it("marks free as current for free users", () => {
    const state = buildSubscriptionPlanCardState(
      { ...plusPlan, code: "free", name: "Gratuit", is_highlighted: false },
      freeMe,
    );
    expect(state.ctaDisabled).toBe(true);
  });

  it("enables plus checkout CTA for free users", () => {
    const state = buildSubscriptionPlanCardState(plusPlan, freeMe);
    expect(state.ctaLabel).toBe("Choisir Plus");
    expect(state.ctaDisabled).toBe(false);
  });
});

describe("canCheckoutPlan", () => {
  it("blocks when checkout disabled", () => {
    expect(canCheckoutPlan("plus", freeMe, false)).toBe(false);
  });

  it("allows plus when checkout enabled", () => {
    expect(canCheckoutPlan("plus", freeMe, true)).toBe(true);
  });
});
