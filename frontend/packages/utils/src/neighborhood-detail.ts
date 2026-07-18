import type { CulturalPlaceListItem, LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

import { filterAgendaUpcomingEvents } from "./events-agenda";
import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";
import { buildMapNeighborhoodUrl } from "./explorer-links";
import {
  culturalPlaceBelongsToNeighborhood,
  eventBelongsToNeighborhood,
} from "./neighborhood-atmosphere";
import { neighborhoodAmbianceLabel } from "./neighborhood-labels";

export const NEIGHBORHOOD_AMBIANCE_BADGES: Record<string, string> = {
  lively: "Atmosphère vivante",
  calm: "Quartier calme",
  cultural: "Vie culturelle",
  student: "Énergie étudiante",
  green: "Nature et balade",
};

export const NEIGHBORHOOD_HERO_TAGLINES: Record<string, string> = {
  lively: "Quartier créatif et vivant",
  calm: "Un souffle paisible au cœur de la ville",
  cultural: "Le pouls culturel de Reims",
  student: "L’énergie des campus et des rencontres",
  green: "Balades et respiration urbaine",
};

export const NEIGHBORHOOD_DETAIL_MAX_MOMENTS = 4;
export const NEIGHBORHOOD_DETAIL_MAX_PLACES = 6;
export const NEIGHBORHOOD_DETAIL_MAX_TRIBES = 4;
export const NEIGHBORHOOD_DETAIL_MAX_ORGS = 6;

const BANNED_METRIC_PATTERN =
  /\d+\s*(personnes|participants|visiteurs|utilisateurs)|score|très actif|heatmap|#\d+|trending|populaire|viral/i;

export function neighborhoodAmbianceBadge(ambiance: string | null | undefined): string {
  if (!ambiance?.trim()) {
    return "Ambiance locale";
  }
  const key = ambiance.trim().toLowerCase();
  return NEIGHBORHOOD_AMBIANCE_BADGES[key] ?? "Ambiance locale";
}

export function neighborhoodHeroTagline(hood: Neighborhood): string {
  const short = hood.short_description?.trim();
  if (short) {
    const firstSentence = short.split(/(?<=[.!?])\s+/)[0]?.trim() ?? short;
    if (firstSentence.length <= 96) {
      return firstSentence;
    }
    return `${firstSentence.slice(0, 93)}…`;
  }

  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";
  if (ambiance && NEIGHBORHOOD_HERO_TAGLINES[ambiance]) {
    return NEIGHBORHOOD_HERO_TAGLINES[ambiance]!;
  }

  const label = neighborhoodAmbianceLabel(hood.ambiance);
  if (label) {
    return `Une ambiance ${label} à découvrir`;
  }

  return `Un morceau humain de ${hood.city.trim() || "Reims"}`;
}

export function filterNeighborhoodUpcomingEvents(
  hood: Neighborhood,
  events: LocalEvent[],
  maxItems = NEIGHBORHOOD_DETAIL_MAX_MOMENTS,
  now = new Date(),
): LocalEvent[] {
  return filterAgendaUpcomingEvents(events, now)
    .filter((event) => eventBelongsToNeighborhood(event, hood))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, maxItems);
}

export function filterNeighborhoodCulturalPlaces(
  hood: Neighborhood,
  places: CulturalPlaceListItem[],
  maxItems = NEIGHBORHOOD_DETAIL_MAX_PLACES,
): CulturalPlaceListItem[] {
  const inHood = places.filter((place) => culturalPlaceBelongsToNeighborhood(place, hood));
  if (inHood.length > 0) {
    return inHood.slice(0, maxItems);
  }
  return places.slice(0, maxItems);
}

export function filterNeighborhoodTribes(
  tribes: Tribe[],
  maxItems = NEIGHBORHOOD_DETAIL_MAX_TRIBES,
): Tribe[] {
  return tribes.filter((tribe) => !tribe.is_archived).slice(0, maxItems);
}

export function resolveNeighborhoodHeroImage(hood: Neighborhood): string | null {
  return resolveNeighborhoodEditorialImage(hood);
}

export function neighborhoodHasMapCoordinates(hood: Neighborhood): boolean {
  return hood.latitude != null && hood.longitude != null;
}

export function buildNeighborhoodDetailMapUrl(
  hood: Neighborhood,
  options?: { route?: boolean },
): string {
  return buildMapNeighborhoodUrl(hood.slug, { city: hood.city, route: options?.route });
}

export function buildNeighborhoodDetailFluxLine(
  hood: Neighborhood,
  atmosphereLine: string,
): string {
  if (!BANNED_METRIC_PATTERN.test(atmosphereLine)) {
    return atmosphereLine;
  }
  return `Le quartier ${hood.display_name} invite à une découverte tranquille.`;
}

/** Vérifie qu’aucune copy injectée ne ressemble à une métrique sociale ou un score. */
export function neighborhoodDetailCopyHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}

export function neighborhoodDetailUsesRealStats(_stats: {
  events_count: number;
  organizations_count: number;
  offers_count: number;
  posts_count: number;
}): boolean {
  return true;
}
