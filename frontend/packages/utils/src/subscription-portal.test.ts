import { describe, expect, it } from "vitest";

import { SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA } from "./subscription-portal-labels";
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

  // PAY-01-GUARD — Stripe est desactive cote serveur (`checkout_enabled: false`).
  // Un bouton d'achat actif promettrait alors un achat impossible : la personne
  // clique et n'apprend qu'apres coup que le paiement n'existe pas.
  it("mutes the plus CTA when checkout is disabled", () => {
    const state = buildSubscriptionPlanCardState(plusPlan, freeMe, false);
    expect(state.ctaDisabled).toBe(true);
    expect(state.ctaVariant).toBe("muted");
    expect(state.ctaLabel).toBe(SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA);
  });

  it("mutes the premium CTA when checkout is disabled", () => {
    const state = buildSubscriptionPlanCardState(
      { ...plusPlan, code: "premium", name: "Premium" },
      freeMe,
      false,
    );
    expect(state.ctaDisabled).toBe(true);
    expect(state.ctaLabel).toBe(SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA);
  });

  // Le defaut `true` protege les appelants existants : sans troisieme argument,
  // le comportement d'avant PAY-01-GUARD est conserve a l'identique.
  it("keeps the paid CTA active when checkout is enabled", () => {
    expect(buildSubscriptionPlanCardState(plusPlan, freeMe, true).ctaDisabled).toBe(false);
    expect(buildSubscriptionPlanCardState(plusPlan, freeMe).ctaDisabled).toBe(false);
  });

  // L'offre gratuite ne doit rien perdre : elle reste presentee et selectionnable
  // comme avant, quel que soit l'etat du paiement.
  it("leaves the free plan untouched when checkout is disabled", () => {
    const state = buildSubscriptionPlanCardState(
      { ...plusPlan, code: "free", name: "Gratuit", is_highlighted: false },
      freeMe,
      false,
    );
    expect(state.isCurrent).toBe(true);
    expect(state.ctaLabel).toBe("Votre offre actuelle");
  });

  // Un abonne paye ne doit pas voir son plan courant requalifie en « bientot
  // disponible » : l'etat « Votre offre actuelle » prime.
  it("still shows the current plan as current when checkout is disabled", () => {
    const state = buildSubscriptionPlanCardState(
      plusPlan,
      { ...freeMe, plan_code: "plus" },
      false,
    );
    expect(state.isCurrent).toBe(true);
    expect(state.ctaLabel).toBe("Votre offre actuelle");
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
