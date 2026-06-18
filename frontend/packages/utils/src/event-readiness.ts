/** Local event readiness — RF-03A (mirrors backend event_readiness). */

import type {
  EventContentClassification,
  EventReadinessCheck,
  EventReadinessFields,
  EventReadinessLevel,
  TerritoryEventHealthFields,
  TerritoryEventHealthLevel,
} from "@yunicity/types";

export const EVENT_READINESS_LABELS: Record<EventReadinessLevel, string> = {
  ready: "Prêt",
  partial: "Partiel",
  not_ready: "Non prêt",
};

export const EVENT_CONTENT_CLASSIFICATION_LABELS: Record<EventContentClassification, string> = {
  real: "Réel",
  partial: "Partiel",
  placeholder: "Placeholder",
};

export const TERRITORY_EVENT_HEALTH_LABELS: Record<TerritoryEventHealthLevel, string> = {
  healthy: "Agenda vivant",
  warning: "Agenda faible",
  critical: "Aucun événement à venir",
};

const PLACEHOLDER_DESCRIPTION_SNIPPET =
  "un moment pilote proposé dans le cadre du réseau partenaire yunicity";

const VAGUE_EVENT_TITLES = new Set([
  "afterwork découverte",
  "découverte culinaire",
  "atelier ressources locales",
  "conseils style & entretien",
  "événement local",
  "rencontre locale",
]);

export function eventReadinessLabel(level: EventReadinessLevel): string {
  return EVENT_READINESS_LABELS[level];
}

export function territoryEventHealthLabel(level: TerritoryEventHealthLevel): string {
  return TERRITORY_EVENT_HEALTH_LABELS[level];
}

export function isEventPlaceholder(input: {
  title: string;
  description?: string | null;
}): boolean {
  const description = (input.description ?? "").trim().toLowerCase();
  const title = (input.title ?? "").trim().toLowerCase();
  if (description.includes(PLACEHOLDER_DESCRIPTION_SNIPPET)) return true;
  if (VAGUE_EVENT_TITLES.has(title) && description.length < 40) return true;
  return false;
}

export interface EventReadinessInput {
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  location_name: string;
  address?: string | null;
  visibility: string;
  moderation_status: string;
  is_cancelled: boolean;
}

function classifyEventContent(input: {
  title: string;
  description?: string | null;
  location_name: string;
  placeholder: boolean;
}): EventContentClassification {
  if (input.placeholder) return "placeholder";
  const titleOk = input.title.trim().length >= 3;
  const descriptionOk = (input.description ?? "").trim().length >= 25;
  const locationOk = input.location_name.trim().length >= 2;
  if (titleOk && descriptionOk && locationOk) return "real";
  if (titleOk || descriptionOk) return "partial";
  return "placeholder";
}

export function eventReadiness(
  input: EventReadinessInput,
  now = new Date(),
): EventReadinessFields {
  const placeholder = isEventPlaceholder(input);
  const classification = classifyEventContent({
    title: input.title,
    description: input.description,
    location_name: input.location_name,
    placeholder,
  });

  const titleOk = input.title.trim().length >= 3;
  const descriptionText = (input.description ?? "").trim();
  const descriptionOk =
    !placeholder &&
    descriptionText.length >= 25 &&
    !descriptionText.toLowerCase().includes(PLACEHOLDER_DESCRIPTION_SNIPPET);
  const startsAt = new Date(input.starts_at);
  const dateOk = !Number.isNaN(startsAt.getTime());
  const dateFuture = dateOk && startsAt.getTime() >= now.getTime();
  const locationOk = input.location_name.trim().length >= 2;
  const visibilityOk = input.visibility === "public";
  const publicationOk = input.moderation_status === "approved" && !input.is_cancelled;

  const checks: EventReadinessCheck[] = [
    {
      key: "title_defined",
      label: "Titre défini",
      passed: titleOk,
      severity: titleOk ? "ok" : "error",
    },
    {
      key: "description_defined",
      label: "Description définie",
      passed: descriptionOk,
      severity: descriptionOk ? "ok" : "error",
    },
    {
      key: "date_defined",
      label: "Date définie",
      passed: dateOk,
      severity: dateOk ? "ok" : "error",
    },
    {
      key: "location_defined",
      label: "Lieu défini",
      passed: locationOk,
      severity: locationOk ? "ok" : "error",
    },
    {
      key: "visibility_enabled",
      label: "Visibilité publique",
      passed: visibilityOk,
      severity: visibilityOk ? "ok" : "warning",
    },
    {
      key: "publication_enabled",
      label: "Publication activée",
      passed: publicationOk,
      severity: publicationOk ? "ok" : "warning",
    },
    {
      key: "date_upcoming",
      label: "Événement à venir",
      passed: dateFuture,
      severity: dateFuture ? "ok" : "warning",
    },
    {
      key: "not_placeholder",
      label: "Contenu réel (non placeholder)",
      passed: !placeholder,
      severity: placeholder ? "error" : "ok",
    },
  ];

  const coreReady = titleOk && descriptionOk && locationOk && !placeholder && dateOk;
  let readiness: EventReadinessLevel;
  if (coreReady && publicationOk && visibilityOk && dateFuture) {
    readiness = "ready";
  } else if (placeholder || !titleOk || input.is_cancelled) {
    readiness = "not_ready";
  } else if (coreReady || (titleOk && locationOk)) {
    readiness = "partial";
  } else {
    readiness = "not_ready";
  }

  const contributes =
    readiness === "ready" && publicationOk && visibilityOk && dateFuture && !placeholder;

  return {
    readiness,
    classification,
    contributes_to_territory: contributes,
    territory_contribution_label: contributes
      ? "Cet événement contribue à maintenir l'agenda actif."
      : "Cet événement est incomplet et n'améliore pas la vitalité du territoire.",
    checks,
  };
}

export function territoryEventHealth(upcomingPublishedCount: number): TerritoryEventHealthFields {
  const count = Math.max(upcomingPublishedCount, 0);
  let status: TerritoryEventHealthLevel;
  if (count >= 5) status = "healthy";
  else if (count >= 1) status = "warning";
  else status = "critical";

  const label = territoryEventHealthLabel(status);
  const signal_emoji = status === "healthy" ? "🟢" : status === "warning" ? "🟡" : "🔴";

  return {
    status,
    upcoming_published_count: count,
    label,
    signal_emoji,
  };
}
