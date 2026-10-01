import type {
  MembershipBillingInterval,
  MembershipPlanCode,
  SubscriptionMe,
  SubscriptionPlan,
} from "@yunicity/types";

import { SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA } from "./subscription-portal-labels";

export type SubscriptionBillingToggle = MembershipBillingInterval;

export function formatSubscriptionPrice(cents: number, currency = "EUR"): string {
  if (cents === 0) return "0€";
  const amount = cents / 100;
  const formatted = amount.toLocaleString("fr-FR", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === "EUR" ? `${formatted}€` : `${formatted} ${currency}`;
}

export function resolveSubscriptionPlanPrice(
  plan: SubscriptionPlan,
  interval: SubscriptionBillingToggle,
): { displayCents: number; suffix: string } {
  if (plan.code === "free") {
    return { displayCents: 0, suffix: "/mois" };
  }
  if (interval === "annual") {
    return {
      displayCents: plan.price.annual_monthly_equivalent_cents,
      suffix: "/mois (facturé annuellement)",
    };
  }
  return { displayCents: plan.price.monthly_cents, suffix: "/mois" };
}

export type SubscriptionPlanCardState = {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaVariant: "primary" | "outline" | "muted";
};

/**
 * PAY-01-GUARD — l'état du bouton doit refléter la disponibilité RÉELLE du
 * paiement.
 *
 * `checkoutEnabled` est optionnel et vaut `true` par défaut : les appelants
 * existants et leurs tests gardent exactement leur comportement. Quand le
 * paiement est désactivé côté serveur (`checkout_enabled: false`), un plan
 * payant ne doit plus présenter un bouton d'achat actif — sinon la personne
 * clique et n'apprend qu'après coup que l'achat est impossible.
 *
 * `canCheckoutPlan` reste le garde dur qui empêche tout appel Stripe ; cette
 * fonction ne fait que rendre l'interface honnête en amont du clic.
 */
export function buildSubscriptionPlanCardState(
  plan: SubscriptionPlan,
  me: SubscriptionMe | null,
  checkoutEnabled = true,
): SubscriptionPlanCardState {
  const currentCode = me?.plan_code ?? "free";

  if (plan.code === "free") {
    const isCurrent = currentCode === "free";
    return {
      plan,
      isCurrent,
      ctaLabel: isCurrent ? "Votre offre actuelle" : "Offre gratuite",
      ctaDisabled: true,
      ctaVariant: "muted",
    };
  }

  if (plan.code === "plus") {
    const isCurrent = currentCode === "plus";
    if (!isCurrent && !checkoutEnabled) {
      return {
        plan,
        isCurrent,
        ctaLabel: SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA,
        ctaDisabled: true,
        ctaVariant: "muted",
      };
    }
    return {
      plan,
      isCurrent,
      ctaLabel: isCurrent ? "Votre offre actuelle" : "Choisir Plus",
      ctaDisabled: isCurrent,
      ctaVariant: isCurrent ? "muted" : "primary",
    };
  }

  const isCurrent = currentCode === "premium";
  const isDowngradeBlocked = currentCode === "premium";
  if (!isCurrent && !isDowngradeBlocked && !checkoutEnabled) {
    return {
      plan,
      isCurrent,
      ctaLabel: SUBSCRIPTION_CHECKOUT_UNAVAILABLE_CTA,
      ctaDisabled: true,
      ctaVariant: "muted",
    };
  }
  return {
    plan,
    isCurrent,
    ctaLabel: isCurrent ? "Votre offre actuelle" : "Choisir Premium",
    ctaDisabled: isCurrent || isDowngradeBlocked,
    ctaVariant: isCurrent ? "muted" : "outline",
  };
}

export function canCheckoutPlan(
  planCode: MembershipPlanCode,
  me: SubscriptionMe | null,
  checkoutEnabled: boolean,
): boolean {
  if (!checkoutEnabled) return false;
  if (planCode === "free") return false;
  const current = me?.plan_code ?? "free";
  if (current === planCode) return false;
  if (current === "premium") return false;
  return true;
}
