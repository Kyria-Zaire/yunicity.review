import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";

import { buildPublicPlaceHref } from "./place-routing";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import { neighborhoodAmbianceBadge } from "./neighborhood-detail";
import { neighborhoodAmbianceLabel } from "./neighborhood-labels";
import type { TransitCarouselItem } from "./map-labels";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AGENDA,
  NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AMBIANCE,
  NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AREA,
  NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_MOMENTS,
  NEIGHBORHOOD_DETAIL_PORTAL_TAB_ABOUT,
  NEIGHBORHOOD_DETAIL_PORTAL_TAB_EVENTS,
  NEIGHBORHOOD_DETAIL_PORTAL_TAB_PLACES,
  NEIGHBORHOOD_DETAIL_PORTAL_TAB_PRACTICAL,
} from "./neighborhood-detail-portal-labels";

export const NEIGHBORHOOD_DETAIL_PORTAL_MAX_PLACES = 8;
export const NEIGHBORHOOD_DETAIL_PRESENTATION_TRUNCATE = 220;

export type NeighborhoodDetailTabId = "about" | "places" | "events" | "practical";

export type NeighborhoodDetailTab = {
  id: NeighborhoodDetailTabId;
  label: string;
  anchor: string;
};

export type NeighborhoodDetailBreadcrumb = {
  label: string;
  href?: string;
};

export type NeighborhoodDetailQuickStat = {
  id: string;
  value: string;
  label: string;
};

export type NeighborhoodDetailBriefFact = {
  id: string;
  label: string;
  value: string;
};

export type NeighborhoodDetailPlaceCard = {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string | null;
  href: string;
};

export type TransitLinesSummary = {
  tram: string | null;
  bus: string | null;
};

export const NEIGHBORHOOD_DETAIL_TABS: NeighborhoodDetailTab[] = [
  { id: "about", label: NEIGHBORHOOD_DETAIL_PORTAL_TAB_ABOUT, anchor: "#neighborhood-about" },
  { id: "places", label: NEIGHBORHOOD_DETAIL_PORTAL_TAB_PLACES, anchor: "#neighborhood-places" },
  { id: "events", label: NEIGHBORHOOD_DETAIL_PORTAL_TAB_EVENTS, anchor: "#neighborhood-moments" },
  {
    id: "practical",
    label: NEIGHBORHOOD_DETAIL_PORTAL_TAB_PRACTICAL,
    anchor: "#neighborhood-practical",
  },
];

export function formatNeighborhoodApproxArea(radiusMeters: number | null | undefined): string | null {
  if (radiusMeters == null || radiusMeters <= 0) {
    return null;
  }
  const km2 = Math.PI * (radiusMeters / 1000) ** 2;
  if (km2 < 0.1) {
    return "< 0,1 km²";
  }
  return `${km2.toFixed(1).replace(".", ",")} km²`;
}

export function buildNeighborhoodDetailBreadcrumbs(hood: Neighborhood): NeighborhoodDetailBreadcrumb[] {
  const city = hood.city.trim() || "Reims";
  const cityHref = `/neighborhoods?city=${encodeURIComponent(city)}`;
  return [
    { label: "Quartiers", href: cityHref },
    { label: city, href: cityHref },
    { label: hood.display_name },
  ];
}

export function buildNeighborhoodDetailQuickStats(
  hood: Neighborhood,
  eventsCount: number,
): NeighborhoodDetailQuickStat[] {
  const stats: NeighborhoodDetailQuickStat[] = [];

  const area = formatNeighborhoodApproxArea(hood.radius_meters);
  if (area) {
    stats.push({ id: "area", value: area, label: NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AREA });
  }

  if (eventsCount > 0) {
    stats.push({
      id: "moments",
      value: String(eventsCount),
      label: NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_MOMENTS,
    });
  } else {
    stats.push({
      id: "moments",
      value: "Calme",
      label: NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AGENDA,
    });
  }

  stats.push({
    id: "ambiance",
    value: neighborhoodAmbianceBadge(hood.ambiance),
    label: NEIGHBORHOOD_DETAIL_PORTAL_QUICK_STAT_AMBIANCE,
  });

  return stats;
}

export function buildNeighborhoodDetailBriefFacts(params: {
  hood: Neighborhood;
  eventsCount: number;
  placesCount: number;
  organizationsCount: number;
  tribesCount: number;
}): NeighborhoodDetailBriefFact[] {
  const { hood, eventsCount, placesCount, organizationsCount, tribesCount } = params;
  const facts: NeighborhoodDetailBriefFact[] = [];

  const area = formatNeighborhoodApproxArea(hood.radius_meters);
  if (area) {
    facts.push({ id: "area", label: "Zone approximative", value: area });
  }

  const ambWord = neighborhoodAmbianceLabel(hood.ambiance);
  if (ambWord) {
    const capitalized = ambWord.charAt(0).toUpperCase() + ambWord.slice(1);
    facts.push({ id: "ambiance", label: "Ambiance", value: capitalized });
  }

  if (eventsCount > 0) {
    facts.push({
      id: "events",
      label: "Moments à venir",
      value: `${eventsCount} sur l’agenda`,
    });
  }

  if (placesCount > 0) {
    facts.push({
      id: "places",
      label: "Lieux référencés",
      value: `${placesCount} repère${placesCount > 1 ? "s" : ""}`,
    });
  }

  const localActors = organizationsCount + tribesCount;
  if (localActors > 0) {
    facts.push({
      id: "local",
      label: "Vie locale",
      value: `${localActors} acteur${localActors > 1 ? "s" : ""}`,
    });
  }

  if (hood.latitude != null && hood.longitude != null) {
    facts.push({
      id: "access",
      label: "Accès",
      value: "Carte & itinéraire disponibles",
    });
  }

  return facts;
}

export function resolveNeighborhoodPresentationText(hood: Neighborhood): string | null {
  const text = hood.short_description?.trim();
  return text || null;
}

export function shouldTruncateNeighborhoodPresentation(text: string): boolean {
  return text.length > NEIGHBORHOOD_DETAIL_PRESENTATION_TRUNCATE;
}

export function truncateNeighborhoodPresentation(text: string): string {
  if (!shouldTruncateNeighborhoodPresentation(text)) {
    return text;
  }
  return `${text.slice(0, NEIGHBORHOOD_DETAIL_PRESENTATION_TRUNCATE).trimEnd()}…`;
}

export function resolveNeighborhoodPracticalAddress(
  hood: Neighborhood,
  places: CulturalPlaceListItem[],
): string {
  const placeWithAddress = places.find((place) => place.address?.trim());
  if (placeWithAddress?.address.trim()) {
    return placeWithAddress.address.trim();
  }
  const city = hood.city.trim() || "Reims";
  return `${hood.display_name}, ${city}`;
}

export function buildNeighborhoodDetailPlaceCards(
  places: CulturalPlaceListItem[],
  city: string,
  maxItems = NEIGHBORHOOD_DETAIL_PORTAL_MAX_PLACES,
): NeighborhoodDetailPlaceCard[] {
  return places.slice(0, maxItems).map((place) => ({
    id: place.id,
    name: place.name,
    tagline: place.editorial_excerpt?.trim() || place.short_description?.trim() || place.category,
    imageUrl: resolveCulturalPlaceDisplayUrl(place, "hero"),
    href: buildPublicPlaceHref(place.slug, city),
  }));
}

export function buildNeighborhoodDetailMapPreviewUrl(
  hood: Neighborhood,
  places: CulturalPlaceListItem[],
  accessToken: string,
  options?: { width?: number; height?: number },
): string | null {
  const token = accessToken.trim();
  if (!token || hood.latitude == null || hood.longitude == null) {
    return null;
  }

  const overlays: string[] = [];
  for (const place of places.filter((p) => p.latitude && p.longitude).slice(0, 5)) {
    overlays.push(`pin-s+6366F1(${place.longitude},${place.latitude})`);
  }
  overlays.push(`pin-l+2A2FFF(${hood.longitude},${hood.latitude})`);

  const width = options?.width ?? 640;
  const height = options?.height ?? 360;
  const center = `${hood.longitude},${hood.latitude},14,0`;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${overlays.join(",")}/${center}/${width}x${height}@2x?access_token=${encodeURIComponent(token)}`;
}

export function summarizeTransitLines(items: TransitCarouselItem[]): TransitLinesSummary | null {
  if (!items.length) {
    return null;
  }

  const trams = new Set<string>();
  const buses = new Set<string>();

  for (const item of items) {
    if (item.routeType === "tram") {
      trams.add(item.routeShortName);
    } else if (item.routeType === "bus" || item.routeType === "trolleybus") {
      buses.add(item.routeShortName);
    }
  }

  const tram =
    trams.size > 0
      ? `Tram ${[...trams].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })).join(", ")}`
      : null;
  const bus =
    buses.size > 0
      ? `Bus ${[...buses].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })).join(", ")}`
      : null;

  if (!tram && !bus) {
    return null;
  }

  return { tram, bus };
}

/** Vérifie l’absence de métriques fictives (notes, population, horaires commerces). */
export function neighborhoodDetailPortalCopyIsSafe(lines: string[]): boolean {
  const banned =
    /\b\d+[,.]\d+\s*\(\d+\s*avis\)|habitants|horaires commerces|parking erlon|très sûre|score|#\d+/i;
  return lines.every((line) => !banned.test(line));
}
