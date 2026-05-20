/** Neighborhood UI micro-copy (TICKET-603). */

import type { FeedNeighborhoodSummary } from "@yunicity/types";

export const NEIGHBORHOODS_PAGE_TITLE = "Quartiers";
export const NEIGHBORHOODS_PAGE_SUBTITLE = "Reims par morceaux humains — ambiances locales à découvrir.";
export const NEIGHBORHOODS_EMPTY = "Aucun quartier n’est disponible pour cette ville pour l’instant.";
export const NEIGHBORHOODS_ERROR = "Impossible de charger les quartiers.";
export const NEIGHBORHOODS_RETRY = "Réessayer";
export const NEIGHBORHOOD_DISCOVER_CTA = "Découvrir";
export const NEIGHBORHOOD_DETAIL_EVENTS = "Moments à venir";
export const NEIGHBORHOOD_DETAIL_ORGS = "Lieux du quartier";
export const NEIGHBORHOOD_DETAIL_OFFERS = "Offres à proximité";
export const NEIGHBORHOOD_DETAIL_POSTS = "Publications récentes";
export const NEIGHBORHOOD_DETAIL_EMPTY_SECTION = "Rien pour le moment — le quartier se réveille doucement.";
export const NEIGHBORHOOD_NOT_FOUND = "Ce quartier n’est pas disponible.";
export const NEIGHBORHOOD_AMBIANCE_PREFIX = "Une ambiance";

export const NEIGHBORHOOD_AMBIANCE_LABELS: Record<string, string> = {
  calm: "calme",
  lively: "vivante",
  cultural: "culturelle",
  student: "étudiante",
  green: "verte",
};

export function neighborhoodAmbianceLabel(ambiance: string | null | undefined): string | null {
  if (!ambiance) {
    return null;
  }
  return NEIGHBORHOOD_AMBIANCE_LABELS[ambiance] ?? null;
}

export function neighborhoodAmbianceLine(ambiance: string | null | undefined): string | null {
  const label = neighborhoodAmbianceLabel(ambiance);
  if (!label) {
    return null;
  }
  return `${NEIGHBORHOOD_AMBIANCE_PREFIX} ${label}.`;
}

/** Territorial line for events: "Boulingrin · Reims" — no ranking copy. */
export function formatTerritorialLine(
  neighborhood: FeedNeighborhoodSummary | null | undefined,
  city: string | null | undefined,
  district?: string | null,
): string | null {
  const place = neighborhood?.display_name ?? district?.trim();
  const c = city?.trim();
  if (place && c) {
    return `${place} · ${c}`;
  }
  if (place) {
    return place;
  }
  if (c) {
    return c;
  }
  return null;
}

export function neighborhoodHref(slug: string, city: string): string {
  return `/neighborhoods/${encodeURIComponent(slug)}?city=${encodeURIComponent(city)}`;
}
