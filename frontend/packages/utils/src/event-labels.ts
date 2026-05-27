/** Local events micro-copy (TICKET-505). */

import type { FeedEventMeta, LocalEvent } from "@yunicity/types";

export const EVENTS_PAGE_TITLE = "Moments locaux";
export const EVENTS_PAGE_SUBTITLE = "Cette semaine sur le territoire";
export const EVENTS_EMPTY = "Aucun moment local pour l’instant. Revenez bientôt.";
export const EVENT_INTEREST_CTA = "Je suis intéressé";
export const EVENT_INTEREST_SAVED = "Moment sauvegardé";
export const EVENT_FEED_BADGE = "Moment local";

export const EVENT_TYPE_LABELS: Record<string, string> = {
  cafe_meetup: "Café-rencontre",
  local_market: "Marché local",
  market: "Marché local",
  meetup: "Rencontre locale",
  workshop: "Atelier",
  association_evening: "Soirée associative",
  student_event: "Événement étudiant",
  local_concert: "Concert local",
  exhibition: "Exposition",
  creator_meetup: "Meetup créateur",
  partner_event: "Événement partenaire",
};

export function formatEventDateRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (!endsAt) {
    return `${date} · ${time}`;
  }
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time} – ${endTime}`;
}

export function formatEventLocation(
  event: LocalEvent | FeedEventMeta,
  city?: string | null,
): string {
  const place = event.location_name;
  const c = city ?? ("city" in event ? event.city : null);
  if (c) {
    return `${place} · ${c}`;
  }
  return place;
}

export function eventTypeLabel(eventType: string | null | undefined): string | null {
  if (!eventType) {
    return null;
  }
  return EVENT_TYPE_LABELS[eventType] ?? null;
}
