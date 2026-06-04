import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";

import { isAuthError } from "./auth/auth-errors";
import { eventCalendarDayKey } from "./events-agenda";
import { EVENT_DETAIL_ACCESS_FREE } from "./event-detail-labels";
import { eventBelongsToNeighborhood } from "./neighborhood-atmosphere";
import { neighborhoodAmbianceLine, neighborhoodHref } from "./neighborhood-labels";

export type EventPracticalRow = {
  label: string;
  value: string;
};

export type EventNeighborhoodContext = {
  slug: string;
  name: string;
  editorialLine: string;
  ambianceLine: string | null;
  neighborhoodHref: string;
};

function squaredDistance(latA: number, lonA: number, latB: number, lonB: number): number {
  const dLat = latA - latB;
  const dLon = lonA - lonB;
  return dLat * dLat + dLon * dLon;
}

/** Lundi de la semaine locale (clé jour agenda). */
export function eventWeekStartKey(iso: string): string {
  const date = new Date(iso);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return eventCalendarDayKey(monday.toISOString());
}

export function eventsShareSameWeek(aIso: string, bIso: string): boolean {
  return eventWeekStartKey(aIso) === eventWeekStartKey(bIso);
}

export function formatEventAccessPrice(_event: LocalEvent): string {
  return EVENT_DETAIL_ACCESS_FREE;
}

export function formatEventDateHeading(startsAt: string): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return "";
  }
  return start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function buildEventPracticalRows(event: LocalEvent, categoryLabel: string | null): EventPracticalRow[] {
  const start = new Date(event.starts_at);
  const dateValue = formatEventDateHeading(event.starts_at);
  const startTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const endTime = event.ends_at
    ? new Date(event.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const rows: EventPracticalRow[] = [
    { label: "Date", value: dateValue },
    { label: "Début", value: startTime },
    { label: "Fin", value: endTime },
    { label: "Lieu", value: event.location_name },
  ];

  if (event.address?.trim()) {
    rows.push({ label: "Adresse", value: event.address.trim() });
  }

  const district =
    event.neighborhood_summary?.display_name ?? event.district?.trim() ?? null;
  if (district) {
    rows.push({ label: "Quartier", value: district });
  }

  if (event.city?.trim()) {
    rows.push({ label: "Ville", value: event.city.trim() });
  }

  if (event.organization?.name) {
    rows.push({ label: "Organisateur", value: event.organization.name });
  }

  rows.push({ label: "Tarif", value: formatEventAccessPrice(event) });

  if (categoryLabel) {
    rows.push({ label: "Catégorie", value: categoryLabel });
  }

  return rows;
}

export function pickRelatedEvents(
  current: LocalEvent,
  candidates: LocalEvent[],
  maxItems = 3,
): LocalEvent[] {
  const currentSlug = current.neighborhood_summary?.slug?.trim() ?? null;
  const currentType = current.event_type?.trim().toLowerCase() ?? null;

  const scored = candidates
    .filter((event) => event.id !== current.id && !event.is_cancelled)
    .map((event) => {
      let score = 0;
      const hoodSlug = event.neighborhood_summary?.slug?.trim() ?? null;
      if (currentSlug && hoodSlug && currentSlug === hoodSlug) {
        score += 3;
      }
      const type = event.event_type?.trim().toLowerCase() ?? null;
      if (currentType && type && currentType === type) {
        score += 2;
      }
      if (eventsShareSameWeek(current.starts_at, event.starts_at)) {
        score += 1;
      }
      return { event, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.event.starts_at).getTime() - new Date(b.event.starts_at).getTime();
    });

  return scored.slice(0, maxItems).map(({ event }) => event);
}

export function pickNearbyCulturalPlaces(
  event: LocalEvent,
  places: CulturalPlaceListItem[],
  maxItems = 3,
): CulturalPlaceListItem[] {
  if (places.length === 0) {
    return [];
  }

  if (event.latitude == null || event.longitude == null) {
    return places.slice(0, maxItems);
  }

  return [...places]
    .map((place) => ({
      place,
      distance: squaredDistance(event.latitude!, event.longitude!, place.latitude, place.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxItems)
    .map(({ place }) => place);
}

export function resolveEventNeighborhoodContext(
  event: LocalEvent,
  neighborhoods: Neighborhood[],
): EventNeighborhoodContext | null {
  const summary = event.neighborhood_summary;
  const matched =
    (summary
      ? neighborhoods.find((hood) => hood.slug === summary.slug)
      : null) ??
    neighborhoods.find((hood) => eventBelongsToNeighborhood(event, hood)) ??
    null;

  const slug = summary?.slug ?? matched?.slug;
  const name = summary?.display_name ?? matched?.display_name;
  if (!slug || !name) {
    return null;
  }

  const city = event.city.trim() || "Reims";
  const editorialLine =
    matched?.short_description?.trim() ||
    matched?.ambiance?.trim() ||
    `Un quartier de ${city} où ce moment prend tout son sens.`;

  return {
    slug,
    name,
    editorialLine,
    ambianceLine: neighborhoodAmbianceLine(matched?.ambiance ?? null),
    neighborhoodHref: neighborhoodHref(slug, city),
  };
}

export function buildMapboxStaticPreviewUrl(
  latitude: number,
  longitude: number,
  accessToken: string,
  options?: { width?: number; height?: number },
): string | null {
  const token = accessToken.trim();
  if (!token) {
    return null;
  }
  const width = options?.width ?? 640;
  const height = options?.height ?? 280;
  const pin = `pin-s+2A2FFF(${longitude},${latitude})`;
  const center = `${longitude},${latitude},14,0`;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pin}/${center}/${width}x${height}@2x?access_token=${encodeURIComponent(token)}`;
}

export function eventHasMapCoordinates(event: LocalEvent): boolean {
  return event.latitude != null && event.longitude != null;
}

/** Public event detail: staff/org cancel (API 410 EVENT_CANCELLED). */
export function isEventCancelledError(err: unknown): boolean {
  return isAuthError(err) && err.status === 410 && err.code === "EVENT_CANCELLED";
}
