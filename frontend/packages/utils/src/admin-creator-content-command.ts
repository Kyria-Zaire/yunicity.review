/** Admin creator content editorial command center helpers (CREATOR-CONTENT-V2-01) — UX pure. */

import type { PartnerCreatorContentAdminSummaryResponse } from "@yunicity/types";

import { buildCreatorContentListPath } from "./admin-creator-content";

export const DEFAULT_ADMIN_CREATOR_CONTENT_CITY = "Reims";
export const CREATOR_CONTENT_EDITORIAL_PILOT_GOAL = 10;

export type CreatorContentEditorialSignalType = "empty" | "pending" | "rejected" | "approved";

export interface CreatorContentEditorialMetrics {
  city: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  contributingPartners: number;
}

export interface CreatorContentEditorialSignal {
  type: CreatorContentEditorialSignalType;
  title: string;
  description: string;
}

export interface CreatorContentEditorialNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface CreatorContentEditorialKpiCard {
  id: string;
  label: string;
  value: number;
  hint: string;
}

export interface CreatorContentEditorialMomentum {
  city: string;
  approvedCount: number;
  goal: number;
  progressPercent: number;
  progressRatio: number;
  microcopy: string;
}

export function buildCreatorContentEditorialMetricsFromSummary(
  summary: PartnerCreatorContentAdminSummaryResponse,
): CreatorContentEditorialMetrics {
  return {
    city: summary.city,
    total: summary.total,
    pending: summary.pending_review,
    approved: summary.published,
    rejected: summary.rejected,
    contributingPartners: summary.contributing_partners,
  };
}

export function buildCreatorContentEditorialSignal(
  metrics: CreatorContentEditorialMetrics,
): CreatorContentEditorialSignal {
  if (metrics.pending > 0) {
    return {
      type: "pending",
      title: "Des contenus attendent une validation.",
      description: `${metrics.pending} contenu(s) doivent être examinés avant publication.`,
    };
  }

  if (metrics.rejected > 0) {
    return {
      type: "rejected",
      title: "Des refus nécessitent un suivi.",
      description: "Certains contenus ont été refusés et peuvent nécessiter un retour partenaire.",
    };
  }

  if (metrics.approved > 0) {
    return {
      type: "approved",
      title: "La visibilité locale prend forme.",
      description: "Des contenus validés commencent à enrichir Yunicity.",
    };
  }

  return {
    type: "empty",
    title: "La file éditoriale attend ses premiers contenus.",
    description: "Les partenaires pourront bientôt alimenter la visibilité locale de Reims.",
  };
}

export function buildCreatorContentEditorialNextAction(
  metrics: CreatorContentEditorialMetrics,
): CreatorContentEditorialNextAction {
  if (metrics.total === 0) {
    return {
      id: "launch",
      title: "Préparez le lancement éditorial.",
      description: "Accompagnez les partenaires vérifiés vers leurs premiers contenus.",
      ctaLabel: "Voir les partenaires",
      href: "/partners",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "pending",
      title: "Validez les contenus en attente.",
      description: "Examinez les propositions éditoriales avant leur publication.",
      ctaLabel: "Voir les contenus à valider",
      href: buildCreatorContentListPath({ status: "pending_review" }),
    };
  }

  if (metrics.approved === 0 && metrics.total > 0) {
    return {
      id: "publish",
      title: "Publiez les premiers récits locaux.",
      description: "La file contient des contenus mais aucun n'est encore validé.",
      ctaLabel: "Voir les contenus en attente",
      href: buildCreatorContentListPath({ status: "pending_review" }),
    };
  }

  return {
    id: "animate",
    title: "Animez la visibilité locale.",
    description: "Continuez à accompagner les partenaires qui racontent le territoire.",
    ctaLabel: "Voir les contenus approuvés",
    href: buildCreatorContentListPath({ status: "published" }),
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildCreatorContentEditorialKpiCards(
  metrics: CreatorContentEditorialMetrics,
): CreatorContentEditorialKpiCard[] {
  return [
    {
      id: "total",
      label: "Contenus totaux",
      value: metrics.total,
      hint: kpiHint(metrics.total, "File à construire", "File alimentée"),
    },
    {
      id: "pending",
      label: "À valider",
      value: metrics.pending,
      hint: kpiHint(metrics.pending, "Aucune validation", "Action requise"),
    },
    {
      id: "approved",
      label: "Approuvés",
      value: metrics.approved,
      hint: kpiHint(metrics.approved, "Aucun contenu visible", "Visibilité active"),
    },
    {
      id: "contributors",
      label: "Partenaires contributeurs",
      value: metrics.contributingPartners,
      hint: kpiHint(metrics.contributingPartners, "Aucun contributeur", "Réseau créatif mobilisé"),
    },
    {
      id: "rejected",
      label: "Refusés",
      value: metrics.rejected,
      hint: kpiHint(metrics.rejected, "Aucun refus", "Suivi partenaire"),
    },
  ];
}

export function creatorContentEditorialMomentumProgress(
  approvedCount: number,
  goal: number = CREATOR_CONTENT_EDITORIAL_PILOT_GOAL,
): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(Math.round((approvedCount / goal) * 100), 100);
}

export function creatorContentEditorialMomentumMicrocopy(approvedCount: number): string {
  if (approvedCount === 0) {
    return "La visibilité locale attend ses premiers récits.";
  }
  if (approvedCount <= 3) {
    return "Les premiers contenus donnent une voix au territoire.";
  }
  if (approvedCount <= 9) {
    return "La narration locale devient attractive.";
  }
  return "La visibilité locale dispose d'une base solide.";
}

export function buildCreatorContentEditorialMomentum(
  metrics: CreatorContentEditorialMetrics,
): CreatorContentEditorialMomentum {
  const approvedCount = metrics.approved;
  const goal = CREATOR_CONTENT_EDITORIAL_PILOT_GOAL;

  return {
    city: metrics.city,
    approvedCount,
    goal,
    progressPercent: creatorContentEditorialMomentumProgress(approvedCount, goal),
    progressRatio: Math.min(approvedCount / goal, 1),
    microcopy: creatorContentEditorialMomentumMicrocopy(approvedCount),
  };
}

export function buildCreatorContentEditorialConseilMessage(
  metrics: CreatorContentEditorialMetrics,
): string {
  if (metrics.total === 0) {
    return "Les premiers contenus donneront une voix locale à Yunicity.";
  }

  if (metrics.pending > 0) {
    return "Validez rapidement les contenus en attente pour enrichir l'expérience citoyenne.";
  }

  if (metrics.approved < CREATOR_CONTENT_EDITORIAL_PILOT_GOAL) {
    return "Visez 10 contenus approuvés pour rendre la narration locale crédible pendant le pilote.";
  }

  return "La visibilité locale dispose d'une base solide. Suivez maintenant les contenus qui génèrent le plus d'engagement.";
}

export function buildCreatorContentEditorialRecommendedAction(
  metrics: CreatorContentEditorialMetrics,
): CreatorContentEditorialNextAction {
  if (metrics.total === 0) {
    return {
      id: "partners",
      title: "Voir les partenaires",
      description: "",
      ctaLabel: "Voir les partenaires",
      href: "/partners",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "validate",
      title: "Valider les contenus",
      description: "",
      ctaLabel: "Voir les contenus à valider",
      href: buildCreatorContentListPath({ status: "pending_review" }),
    };
  }

  return {
    id: "editorial",
    title: "Piloter la visibilité",
    description: "",
    ctaLabel: "Voir les contenus approuvés",
    href: buildCreatorContentListPath({ status: "published" }),
  };
}

export function creatorContentHasActiveFilters(state: {
  status: string;
  organizationId: string;
  q: string;
  city: string;
}): boolean {
  const cityFilterActive =
    Boolean(state.city.trim()) && state.city.trim() !== DEFAULT_ADMIN_CREATOR_CONTENT_CITY;
  return Boolean(state.status || state.organizationId || state.q.trim() || cityFilterActive);
}
