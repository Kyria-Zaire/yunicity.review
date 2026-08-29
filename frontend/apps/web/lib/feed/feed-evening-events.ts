import type { LocalEvent } from "@yunicity/types";

export type FeedEveningEventsMode = "tonight" | "upcoming-evening" | "upcoming";

export function formatFeedEventTime(event: LocalEvent): string | null {
  const instant = new Date(event.starts_at);
  if (Number.isNaN(instant.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: event.timezone || undefined,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(instant);
  }
}

/** Date et heure complètes pour la carte événement éditoriale du fil. */
export function formatFeedFeaturedEventScheduleLabel(
  event: Pick<LocalEvent, "starts_at" | "timezone">,
): string | null {
  const instant = new Date(event.starts_at);
  if (Number.isNaN(instant.getTime())) return null;

  const format = (timeZone?: string) => {
    const date = new Intl.DateTimeFormat("fr-FR", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(instant);
    const time = new Intl.DateTimeFormat("fr-FR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
    const capitalizedDate = date.charAt(0).toUpperCase() + date.slice(1);
    return `${capitalizedDate}, ${time}`;
  };

  try {
    return format(event.timezone || undefined);
  } catch {
    return format(undefined);
  }
}

export function formatFeedEventInterestLabel(count: number): string {
  return `${count} intéressé${count > 1 ? "s" : ""}`;
}

export function resolveFeedEveningEventsTitle(
  city: string,
  mode: FeedEveningEventsMode,
): string {
  if (mode === "tonight") return `Ce soir à ${city}`;
  if (mode === "upcoming-evening") return `Prochaines soirées à ${city}`;
  return `À venir à ${city}`;
}
