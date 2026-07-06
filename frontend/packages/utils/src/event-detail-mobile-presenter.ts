import type { LocalEvent } from "@yunicity/types";

import { buildEventMetaChips } from "./event-detail-portal";
import { formatEventAccessPrice } from "./event-detail";

/** Onglets détail événement mobile (MOBILE-SORTIR-02). */
export type EventMobileDetailTabId = "about" | "details" | "program" | "practical" | "reviews";

export function formatEventMobileQuickDateLine(startsAt: string): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return "Date à confirmer";
  }
  const weekday = start.toLocaleDateString("fr-FR", { weekday: "long" });
  const day = start.getDate();
  const month = start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${day} ${month}.`;
}

export function formatEventMobileTimeRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return "—";
  }
  const startTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (!endsAt) {
    return startTime;
  }
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) {
    return startTime;
  }
  const endTime = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${startTime} – ${endTime}`;
}

export function formatEventMobileParticipantsLine(count: number): string {
  if (count <= 0) {
    return "Soyez le premier intéressé";
  }
  return `${count} participant${count > 1 ? "s" : ""} intéressé${count > 1 ? "s" : ""}`;
}

export function buildEventMobileTagLabels(event: LocalEvent): string[] {
  return buildEventMetaChips(event).map((chip) => chip.label);
}

export function formatEventMobileLocationSubtitle(event: LocalEvent): string {
  return [event.location_name, event.city].filter(Boolean).join(" · ");
}

export function formatEventMobilePriceLine(event: LocalEvent): string {
  return formatEventAccessPrice(event);
}
