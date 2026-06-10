/** Admin moderation Trust & Safety command center helpers (MODERATION-V2-01) — UX pure. */

import type { AdminReportAdminSummaryResponse, AdminReportReason } from "@yunicity/types";

import {
  adminReportReasonLabel,
  buildModerationListPath,
} from "./admin-moderation";

export const MODERATION_ATTENTION_THRESHOLD = 5;

export type ModerationTrustSafetySignalType =
  | "empty"
  | "pending"
  | "attention"
  | "controlled";

export interface ModerationTrustSafetyMetrics {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
  dominantReason: AdminReportReason | null;
}

export interface ModerationTrustSafetySignal {
  type: ModerationTrustSafetySignalType;
  title: string;
  description: string;
}

export interface ModerationTrustSafetyNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface ModerationTrustSafetyKpiCard {
  id: string;
  label: string;
  displayValue: string;
  hint: string;
}

export interface ModerationTrustSafetyMomentum {
  pendingCount: number;
  threshold: number;
  progressRatio: number;
  progressPercent: number;
  microcopy: string;
}

export function buildModerationTrustSafetyMetricsFromSummary(
  summary: AdminReportAdminSummaryResponse,
): ModerationTrustSafetyMetrics {
  return {
    total: summary.total,
    pending: summary.pending,
    resolved: summary.resolved,
    dismissed: summary.dismissed,
    dominantReason: summary.dominant_reason,
  };
}

export function buildModerationTrustSafetySignal(
  metrics: ModerationTrustSafetyMetrics,
): ModerationTrustSafetySignal {
  if (metrics.pending >= MODERATION_ATTENTION_THRESHOLD) {
    return {
      type: "attention",
      title: "Attention requise.",
      description: "La file de modération commence à s'accumuler.",
    };
  }

  if (metrics.pending > 0) {
    return {
      type: "pending",
      title: "Des signalements attendent une vérification.",
      description: `${metrics.pending} signalement${metrics.pending > 1 ? "s" : ""} doivent être examinés par l'équipe.`,
    };
  }

  if (metrics.resolved > 0) {
    return {
      type: "controlled",
      title: "La file est maîtrisée.",
      description: "Les signalements récents ont été traités ou classés.",
    };
  }

  return {
    type: "empty",
    title: "La communauté est calme.",
    description: "Aucun signalement citoyen n'est enregistré pour le moment.",
  };
}

export function buildModerationTrustSafetyNextAction(
  metrics: ModerationTrustSafetyMetrics,
): ModerationTrustSafetyNextAction {
  if (metrics.total === 0) {
    return {
      id: "preserve",
      title: "Préservez la qualité des échanges.",
      description: "La communauté ne présente aucun signalement à traiter.",
      ctaLabel: "Voir les contenus créateurs",
      href: "/creator-content",
    };
  }

  if (metrics.pending >= MODERATION_ATTENTION_THRESHOLD) {
    return {
      id: "priority",
      title: "Traitez la file prioritaire.",
      description: "La file de modération nécessite une revue rapide.",
      ctaLabel: "Voir les signalements en attente",
      href: buildModerationListPath({ status: "pending" }),
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "pending",
      title: "Examinez les signalements en attente.",
      description:
        "Priorisez les contenus signalés avant qu'ils n'affectent l'expérience citoyenne.",
      ctaLabel: "Voir les signalements en attente",
      href: buildModerationListPath({ status: "pending" }),
    };
  }

  return {
    id: "monitor",
    title: "La file est sous contrôle.",
    description: "Continuez à surveiller les nouveaux signalements.",
    ctaLabel: "Voir tous les signalements",
    href: buildModerationListPath({ status: "all" }),
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildModerationTrustSafetyKpiCards(
  metrics: ModerationTrustSafetyMetrics,
): ModerationTrustSafetyKpiCard[] {
  const dominantDisplay = metrics.dominantReason
    ? adminReportReasonLabel(metrics.dominantReason)
    : "—";

  return [
    {
      id: "total",
      label: "Signalements totaux",
      displayValue: String(metrics.total),
      hint: kpiHint(metrics.total, "Aucun incident", "Base de suivi"),
    },
    {
      id: "pending",
      label: "En attente",
      displayValue: String(metrics.pending),
      hint: kpiHint(metrics.pending, "File vide", "À examiner"),
    },
    {
      id: "resolved",
      label: "Traités",
      displayValue: String(metrics.resolved),
      hint: kpiHint(metrics.resolved, "Aucun traitement", "File maîtrisée"),
    },
    {
      id: "dismissed",
      label: "Classés sans suite",
      displayValue: String(metrics.dismissed),
      hint: kpiHint(metrics.dismissed, "Aucun classement", "Signalements non retenus"),
    },
    {
      id: "dominant_reason",
      label: "Motif dominant",
      displayValue: dominantDisplay,
      hint: metrics.dominantReason ? "Motif principal" : "Aucun motif détecté",
    },
  ];
}

export function moderationTrustSafetyMomentumMicrocopy(pendingCount: number): string {
  if (pendingCount === 0) {
    return "La file est vide.";
  }
  if (pendingCount <= 2) {
    return "La file reste maîtrisable.";
  }
  if (pendingCount <= 4) {
    return "La file approche du seuil d'attention.";
  }
  return "Une revue rapide est recommandée.";
}

export function moderationTrustSafetyMomentumProgress(
  pendingCount: number,
  threshold: number = MODERATION_ATTENTION_THRESHOLD,
): number {
  if (threshold <= 0) {
    return 0;
  }
  return Math.min(Math.round((pendingCount / threshold) * 100), 100);
}

export function buildModerationTrustSafetyMomentum(
  metrics: ModerationTrustSafetyMetrics,
): ModerationTrustSafetyMomentum {
  const threshold = MODERATION_ATTENTION_THRESHOLD;
  const pendingCount = metrics.pending;

  return {
    pendingCount,
    threshold,
    progressRatio: Math.min(pendingCount / threshold, 1),
    progressPercent: moderationTrustSafetyMomentumProgress(pendingCount, threshold),
    microcopy: moderationTrustSafetyMomentumMicrocopy(pendingCount),
  };
}

export function buildModerationTrustSafetyConseilMessage(
  metrics: ModerationTrustSafetyMetrics,
): string {
  if (metrics.total === 0) {
    return "La confiance se construit aussi par une veille silencieuse.";
  }

  if (metrics.pending >= MODERATION_ATTENTION_THRESHOLD) {
    return "La file dépasse le seuil recommandé. Priorisez la revue des signalements.";
  }

  if (metrics.pending > 0) {
    return "Examinez rapidement les signalements en attente pour maintenir un espace local sain.";
  }

  if (metrics.resolved > 0) {
    return "La file est maîtrisée. Continuez à surveiller les nouveaux signalements.";
  }

  return "La confiance se construit aussi par une veille silencieuse.";
}

export function buildModerationTrustSafetyRecommendedAction(
  metrics: ModerationTrustSafetyMetrics,
): ModerationTrustSafetyNextAction {
  if (metrics.total === 0) {
    return {
      id: "creator-content",
      title: "Voir les contenus créateurs",
      description: "",
      ctaLabel: "Voir les contenus créateurs",
      href: "/creator-content",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "pending",
      title: "Signalements en attente",
      description: "",
      ctaLabel: "Voir les signalements en attente",
      href: buildModerationListPath({ status: "pending" }),
    };
  }

  return {
    id: "all",
    title: "Tous les signalements",
    description: "",
    ctaLabel: "Voir tous les signalements",
    href: buildModerationListPath({ status: "all" }),
  };
}

export function moderationHasActiveFilters(state: {
  status: string;
  reason: string;
  page: number;
}): boolean {
  const statusFilterActive = state.status !== "" && state.status !== "pending";
  return Boolean(statusFilterActive || state.reason || state.page > 1);
}
