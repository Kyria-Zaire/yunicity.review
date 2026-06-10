/** Admin events agenda command center helpers (EVENTS-V2-01) — UX pure. */

import type { LocalEventAdminSummaryResponse } from "@yunicity/types";

import { buildEventsListPath } from "./admin-event";

export const EVENTS_AGENDA_PILOT_GOAL = 10;

export type EventsAgendaSignalType = "empty" | "pending" | "cancelled" | "upcoming";

export interface EventsAgendaMetrics {
  city: string;
  total: number;
  pending: number;
  published: number;
  upcomingPublished: number;
  cancelledOrArchived: number;
  rejected: number;
}

export interface EventsAgendaSignal {
  type: EventsAgendaSignalType;
  title: string;
  description: string;
}

export interface EventsAgendaNextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface EventsAgendaKpiCard {
  id: string;
  label: string;
  value: number;
  hint: string;
}

export interface EventsAgendaMomentum {
  city: string;
  upcomingCount: number;
  goal: number;
  progressPercent: number;
  progressRatio: number;
  microcopy: string;
}

export function buildEventsAgendaMetricsFromSummary(
  summary: LocalEventAdminSummaryResponse,
): EventsAgendaMetrics {
  return {
    city: summary.city,
    total: summary.total,
    pending: summary.pending_review,
    published: summary.published,
    upcomingPublished: summary.upcoming_published,
    cancelledOrArchived: summary.cancelled_or_archived,
    rejected: summary.rejected,
  };
}

export function buildEventsAgendaSignal(metrics: EventsAgendaMetrics): EventsAgendaSignal {
  if (metrics.pending > 0) {
    return {
      type: "pending",
      title: "Des événements attendent une validation.",
      description: `${metrics.pending} événement(s) doivent être examinés avant publication.`,
    };
  }

  if (metrics.cancelledOrArchived > 0) {
    return {
      type: "cancelled",
      title: "Des événements nécessitent un suivi.",
      description: "Certains événements ont été annulés ou archivés récemment.",
    };
  }

  if (metrics.upcomingPublished > 0) {
    return {
      type: "upcoming",
      title: "L'agenda local est actif.",
      description: "Des événements sont visibles pour les citoyens de Reims.",
    };
  }

  return {
    type: "empty",
    title: "L'agenda attend ses premiers événements.",
    description: "Ajoutez ou validez des temps forts pour rendre la ville plus vivante.",
  };
}

export function buildEventsAgendaNextAction(
  metrics: EventsAgendaMetrics,
): EventsAgendaNextAction {
  if (metrics.total === 0) {
    return {
      id: "launch",
      title: "Lancez l'agenda territorial.",
      description: "Ajoutez ou accompagnez les premiers événements locaux à Reims.",
      ctaLabel: "Voir les partenaires",
      href: "/partners",
    };
  }

  if (metrics.pending > 0) {
    return {
      id: "pending",
      title: "Validez les événements en attente.",
      description: "Examinez les propositions avant leur publication.",
      ctaLabel: "Voir les événements à valider",
      href: buildEventsListPath({ status: "pending_review" }),
    };
  }

  if (metrics.published === 0 && metrics.total > 0) {
    return {
      id: "publish",
      title: "Publiez les premiers temps forts.",
      description: "L'agenda contient des événements mais aucun n'est encore visible.",
      ctaLabel: "Voir les brouillons",
      href: buildEventsListPath({ status: "pending_review" }),
    };
  }

  return {
    id: "animate",
    title: "Animez l'agenda local.",
    description: "Suivez les prochains événements visibles par les citoyens.",
    ctaLabel: "Voir les événements publiés",
    href: buildEventsListPath({ status: "approved" }),
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildEventsAgendaKpiCards(metrics: EventsAgendaMetrics): EventsAgendaKpiCard[] {
  return [
    {
      id: "total",
      label: "Événements totaux",
      value: metrics.total,
      hint: kpiHint(metrics.total, "Agenda à construire", "Agenda alimenté"),
    },
    {
      id: "pending",
      label: "À valider",
      value: metrics.pending,
      hint: kpiHint(metrics.pending, "Aucune validation", "Action requise"),
    },
    {
      id: "published",
      label: "Publiés",
      value: metrics.published,
      hint: kpiHint(metrics.published, "Rien de visible", "Visibles citoyens"),
    },
    {
      id: "upcoming",
      label: "À venir",
      value: metrics.upcomingPublished,
      hint: kpiHint(metrics.upcomingPublished, "Aucun prochain événement", "Prochains temps forts"),
    },
    {
      id: "cancelled",
      label: "Annulés / archivés",
      value: metrics.cancelledOrArchived,
      hint: kpiHint(metrics.cancelledOrArchived, "Agenda propre", "Suivi nécessaire"),
    },
  ];
}

export function eventsAgendaMomentumProgress(
  upcomingCount: number,
  goal: number = EVENTS_AGENDA_PILOT_GOAL,
): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(Math.round((upcomingCount / goal) * 100), 100);
}

export function eventsAgendaMomentumMicrocopy(upcomingCount: number): string {
  if (upcomingCount === 0) {
    return "L'agenda attend ses premiers temps forts.";
  }
  if (upcomingCount <= 3) {
    return "Les premiers événements donnent vie au territoire.";
  }
  if (upcomingCount <= 9) {
    return "L'agenda devient attractif.";
  }
  return "L'agenda dispose d'une base solide pour le pilote.";
}

export function buildEventsAgendaMomentum(metrics: EventsAgendaMetrics): EventsAgendaMomentum {
  const upcomingCount = metrics.upcomingPublished;
  const goal = EVENTS_AGENDA_PILOT_GOAL;

  return {
    city: metrics.city,
    upcomingCount,
    goal,
    progressPercent: eventsAgendaMomentumProgress(upcomingCount, goal),
    progressRatio: Math.min(upcomingCount / goal, 1),
    microcopy: eventsAgendaMomentumMicrocopy(upcomingCount),
  };
}

export function buildEventsAgendaConseilMessage(metrics: EventsAgendaMetrics): string {
  if (metrics.total === 0) {
    return "Les premiers événements donneront du rythme à l'expérience Yunicity.";
  }

  if (metrics.pending > 0) {
    return "Validez rapidement les événements en attente pour enrichir l'agenda citoyen.";
  }

  if (metrics.upcomingPublished < EVENTS_AGENDA_PILOT_GOAL) {
    return "Visez 10 événements publiés à venir pour rendre l'agenda attractif pendant le pilote.";
  }

  return "L'agenda dispose d'une base solide. Suivez maintenant la participation et les contenus créateurs.";
}

export function buildEventsAgendaRecommendedAction(
  metrics: EventsAgendaMetrics,
): EventsAgendaNextAction {
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
      title: "Valider les événements",
      description: "",
      ctaLabel: "Voir les événements à valider",
      href: buildEventsListPath({ status: "pending_review" }),
    };
  }

  return {
    id: "agenda",
    title: "Piloter l'agenda",
    description: "",
    ctaLabel: "Voir l'agenda publié",
    href: buildEventsListPath({ status: "approved" }),
  };
}

export function eventsHasActiveFilters(state: {
  status: string;
  city: string;
  q: string;
  eventType: string;
}): boolean {
  return Boolean(
    state.status || state.q.trim() || state.eventType || state.city.trim(),
  );
}
