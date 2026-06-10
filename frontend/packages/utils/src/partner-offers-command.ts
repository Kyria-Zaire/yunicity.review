/** Passport Offers command center helpers (OFFERS-V2-01) — UX pure. */

import type { PartnerOfferAdminSummaryResponse } from "@yunicity/types";

import { buildOffersListPath } from "./admin-offer";

export const OFFERS_CATALOG_PILOT_GOAL = 10;

export type PartnerOffersCatalogSignalType = "empty" | "pending" | "published" | "expired";

export interface PartnerOffersCatalogMetrics {
  city: string;
  total: number;
  pending: number;
  published: number;
  contributorPartners: number;
  expiredOrInactive: number;
}

export interface PartnerOffersCatalogSignal {
  type: PartnerOffersCatalogSignalType;
  title: string;
  description: string;
}

export interface PartnerOffersCatalogNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface PartnerOffersCatalogKpiCard {
  id: string;
  label: string;
  value: number;
  hint: string;
}

export interface PartnerOffersCatalogMomentum {
  city: string;
  publishedCount: number;
  goal: number;
  progressPercent: number;
  progressRatio: number;
  microcopy: string;
}

export function buildPartnerOffersMetricsFromSummary(
  summary: PartnerOfferAdminSummaryResponse,
): PartnerOffersCatalogMetrics {
  return {
    city: summary.city,
    total: summary.total,
    pending: summary.pending_review,
    published: summary.published,
    contributorPartners: summary.contributor_partners,
    expiredOrInactive: summary.expired_or_inactive,
  };
}

export function buildPartnerOffersCatalogSignal(
  metrics: PartnerOffersCatalogMetrics,
): PartnerOffersCatalogSignal {
  if (metrics.pending > 0) {
    return {
      type: "pending",
      title: "Des offres attendent une validation.",
      description: `${metrics.pending} offre(s) doivent être examinées avant publication.`,
    };
  }

  if (metrics.expiredOrInactive > 0) {
    return {
      type: "expired",
      title: "Des offres nécessitent une mise à jour.",
      description: "Certaines offres sont expirées ou inactives.",
    };
  }

  if (metrics.published > 0) {
    return {
      type: "published",
      title: "Le catalogue est actif.",
      description: "Les citoyens peuvent découvrir les premiers avantages Passport.",
    };
  }

  return {
    type: "empty",
    title: "Le catalogue attend ses premières offres.",
    description: "Ajoutez des avantages partenaires pour donner de la valeur au Passport.",
  };
}

export function buildPartnerOffersCatalogNextAction(
  metrics: PartnerOffersCatalogMetrics,
): PartnerOffersCatalogNextAction {
  if (metrics.total === 0) {
    return {
      id: "first-offer",
      title: "Construisez le premier catalogue Passport.",
      description: "Créez une première offre avec un partenaire pilote.",
      ctaLabel: "Créer une offre",
      href: "/passport-offers/new",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "pending",
      title: "Validez les offres en attente.",
      description: "Examinez les propositions avant leur publication.",
      ctaLabel: "Voir les offres à valider",
      href: buildOffersListPath({ status: "pending_review" }),
    };
  }

  if (metrics.published === 0 && metrics.total > 0) {
    return {
      id: "publish",
      title: "Publiez les premiers avantages.",
      description: "Le catalogue existe mais aucun avantage n'est encore visible.",
      ctaLabel: "Voir les brouillons",
      href: buildOffersListPath({ status: "draft" }),
    };
  }

  return {
    id: "grow",
    title: "Animez le catalogue Passport.",
    description: "Continuez à enrichir les avantages proposés aux citoyens.",
    ctaLabel: "Voir les offres publiées",
    href: buildOffersListPath({ status: "published" }),
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildPartnerOffersCatalogKpiCards(
  metrics: PartnerOffersCatalogMetrics,
): PartnerOffersCatalogKpiCard[] {
  return [
    {
      id: "total",
      label: "Offres totales",
      value: metrics.total,
      hint: kpiHint(metrics.total, "Catalogue à construire", "Catalogue alimenté"),
    },
    {
      id: "pending",
      label: "À valider",
      value: metrics.pending,
      hint: kpiHint(metrics.pending, "Aucune validation", "Action requise"),
    },
    {
      id: "published",
      label: "Publiées",
      value: metrics.published,
      hint: kpiHint(metrics.published, "Aucun avantage visible", "Visibles citoyens"),
    },
    {
      id: "contributors",
      label: "Partenaires contributeurs",
      value: metrics.contributorPartners,
      hint: kpiHint(metrics.contributorPartners, "Aucun partenaire contributeur", "Réseau mobilisé"),
    },
    {
      id: "expired",
      label: "Expirées / inactives",
      value: metrics.expiredOrInactive,
      hint: kpiHint(metrics.expiredOrInactive, "Catalogue à jour", "Mise à jour nécessaire"),
    },
  ];
}

export function partnerOffersCatalogMomentumProgress(
  publishedCount: number,
  goal: number = OFFERS_CATALOG_PILOT_GOAL,
): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(Math.round((publishedCount / goal) * 100), 100);
}

export function partnerOffersCatalogMomentumMicrocopy(publishedCount: number): string {
  if (publishedCount === 0) {
    return "Le catalogue attend ses premiers avantages.";
  }
  if (publishedCount <= 3) {
    return "Les premiers avantages prennent forme.";
  }
  if (publishedCount <= 9) {
    return "Le catalogue devient attractif.";
  }
  return "Le catalogue dispose d'une base solide.";
}

export function buildPartnerOffersCatalogMomentum(
  metrics: PartnerOffersCatalogMetrics,
): PartnerOffersCatalogMomentum {
  const publishedCount = metrics.published;
  const goal = OFFERS_CATALOG_PILOT_GOAL;

  return {
    city: metrics.city,
    publishedCount,
    goal,
    progressPercent: partnerOffersCatalogMomentumProgress(publishedCount, goal),
    progressRatio: Math.min(publishedCount / goal, 1),
    microcopy: partnerOffersCatalogMomentumMicrocopy(publishedCount),
  };
}

export function buildPartnerOffersConseilMessage(
  metrics: PartnerOffersCatalogMetrics,
): string {
  if (metrics.total === 0) {
    return "Le Passport prendra de la valeur avec les premiers avantages partenaires.";
  }

  if (metrics.pending > 0) {
    return "Validez rapidement les offres en attente pour enrichir le catalogue citoyen.";
  }

  if (metrics.published < OFFERS_CATALOG_PILOT_GOAL) {
    return "Visez 10 offres publiées pour rendre le Passport attractif pendant le pilote.";
  }

  return "Le catalogue dispose d'une base solide. Suivez maintenant les usages et les rédemptions.";
}

export function buildPartnerOffersRecommendedAction(
  metrics: PartnerOffersCatalogMetrics,
): PartnerOffersCatalogNextAction {
  if (metrics.total === 0) {
    return {
      id: "create",
      title: "Créer une offre",
      description: "",
      ctaLabel: "Créer une offre",
      href: "/passport-offers/new",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "validate",
      title: "Valider les offres",
      description: "",
      ctaLabel: "Voir les offres à valider",
      href: buildOffersListPath({ status: "pending_review" }),
    };
  }

  return {
    id: "catalog",
    title: "Piloter le catalogue",
    description: "",
    ctaLabel: "Voir le catalogue",
    href: buildOffersListPath({ status: "published" }),
  };
}

export function passportOffersHasActiveFilters(state: {
  status: string;
  organizationId: string;
  offerType: string;
  q: string;
}): boolean {
  return Boolean(state.status || state.organizationId || state.offerType || state.q.trim());
}
