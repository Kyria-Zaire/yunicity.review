import type { MapCulturalPlaceItem, MapEventItem, Neighborhood } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { buildMapEventUrl, buildMapPlaceUrl } from "./explorer-links";
import { mapEventPopupDate } from "./map-labels";
import { resolveMapPlaceImageUrl } from "./map-media-url";
import type { MapLayerVisibility, MapTerritoryLayer } from "./map-living-territory";

export type MapPortalCategoryId =
  | "all"
  | "events"
  | "places"
  | "culture"
  | "nature"
  | "tribes"
  | "neighborhoods"
  | "transit"
  | "partners";

/** MAP-V2.A — filtres territoriaux unifiés (chips + rail). */
export const MAP_V2_A_FILTER_CATEGORY_IDS = [
  "all",
  "neighborhoods",
  "places",
  "events",
  "partners",
] as const satisfies readonly MapPortalCategoryId[];

export type MapV2AFilterCategoryId = (typeof MAP_V2_A_FILTER_CATEGORY_IDS)[number];

export function normalizeMapPortalCategory(category: MapPortalCategoryId): MapPortalCategoryId {
  if ((MAP_V2_A_FILTER_CATEGORY_IDS as readonly string[]).includes(category)) {
    return category;
  }
  if (category === "culture" || category === "nature") {
    return "places";
  }
  return "all";
}

export type MapPortalAmbianceId =
  | "calm"
  | "lively"
  | "romantic"
  | "family"
  | "festive"
  | "nature";

export type MapPortalFilters = {
  category: MapPortalCategoryId;
  openNow: boolean;
  maxDistanceKm: number;
  ambiances: MapPortalAmbianceId[];
};

export type MapAroundYouItem =
  | {
      kind: "event";
      id: string;
      title: string;
      subtitle: string;
      imageUrl: string | null;
      distanceMeters: number;
      meta: string;
      href: string;
    }
  | {
      kind: "place";
      id: string;
      slug: string;
      title: string;
      subtitle: string;
      imageUrl: string | null;
      distanceMeters: number;
      meta: string;
      href: string;
    };

const CULTURE_CATEGORIES = [
  "museum",
  "heritage",
  "cathedral",
  "theatre",
  "library",
  "monument",
] as const;

const NATURE_CATEGORIES = ["park"] as const;

const AMBIANCE_TO_NEIGHBORHOOD: Record<MapPortalAmbianceId, string[]> = {
  calm: ["calme", "residential", "quiet"],
  lively: ["anime", "animé", "centre"],
  romantic: ["romantique", "historique"],
  family: ["familial", "family"],
  festive: ["festif", "nocturne"],
  nature: ["nature", "verdure", "green"],
};

export function resolveMapPortalLayer(category: MapPortalCategoryId): MapTerritoryLayer {
  if (category === "events") return "moments";
  if (category === "places" || category === "culture" || category === "nature") return "lieux";
  if (category === "neighborhoods") return "quartiers";
  if (category === "tribes") return "tribus";
  if (category === "transit") return "transports";
  if (category === "partners") return "all";
  return "all";
}

export function resolveMapPortalPlaceCategories(
  category: MapPortalCategoryId,
): string[] | null {
  if (category === "culture") return [...CULTURE_CATEGORIES];
  if (category === "nature") return [...NATURE_CATEGORIES];
  return null;
}

export function resolveMapPortalLayerVisibility(
  category: MapPortalCategoryId,
): MapLayerVisibility {
  const layer = resolveMapPortalLayer(category);
  if (layer === "moments") {
    return {
      showEvents: true,
      showPlaces: false,
      showNeighborhoods: false,
      showTribes: false,
      emphasizeTransit: false,
    };
  }
  if (layer === "lieux") {
    return {
      showEvents: false,
      showPlaces: true,
      showNeighborhoods: false,
      showTribes: false,
      emphasizeTransit: false,
    };
  }
  if (layer === "quartiers") {
    return {
      showEvents: false,
      showPlaces: false,
      showNeighborhoods: true,
      showTribes: false,
      emphasizeTransit: false,
    };
  }
  if (layer === "tribus") {
    return {
      showEvents: false,
      showPlaces: false,
      showNeighborhoods: false,
      showTribes: true,
      emphasizeTransit: false,
    };
  }
  if (layer === "transports") {
    return {
      showEvents: false,
      showPlaces: false,
      showNeighborhoods: false,
      showTribes: false,
      emphasizeTransit: true,
    };
  }
  if (category === "partners") {
    return {
      showEvents: false,
      showPlaces: false,
      showNeighborhoods: false,
      showTribes: false,
      emphasizeTransit: false,
    };
  }
  return {
    showEvents: true,
    showPlaces: true,
    showNeighborhoods: true,
    showTribes: false,
    emphasizeTransit: false,
  };
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isEventOpenNow(event: MapEventItem, now = new Date()): boolean {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  if (end) return start <= now && now <= end;
  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();
  return sameDay && start >= now;
}

export function filterEventsByPortalFilters(
  events: MapEventItem[],
  filters: MapPortalFilters,
  origin: { latitude: number; longitude: number } | null,
): MapEventItem[] {
  return events.filter((event) => {
    if (filters.openNow && !isEventOpenNow(event)) return false;
    if (origin && filters.maxDistanceKm > 0) {
      const distance = haversineMeters(
        origin.latitude,
        origin.longitude,
        event.latitude,
        event.longitude,
      );
      if (distance > filters.maxDistanceKm * 1000) return false;
    }
    return true;
  });
}

export function filterPlacesByPortalFilters(
  places: MapCulturalPlaceItem[],
  filters: MapPortalFilters,
  origin: { latitude: number; longitude: number } | null,
): MapCulturalPlaceItem[] {
  const categories = resolveMapPortalPlaceCategories(filters.category);
  return places.filter((place) => {
    if (categories && !categories.includes(place.category)) return false;
    if (filters.openNow) return false;
    if (origin && filters.maxDistanceKm > 0) {
      const distance = haversineMeters(
        origin.latitude,
        origin.longitude,
        place.latitude,
        place.longitude,
      );
      if (distance > filters.maxDistanceKm * 1000) return false;
    }
    return true;
  });
}

export function filterNeighborhoodsByAmbiance(
  neighborhoods: Neighborhood[],
  ambiances: MapPortalAmbianceId[],
): Neighborhood[] {
  if (ambiances.length === 0) return neighborhoods;
  return neighborhoods.filter((hood) => {
    const value = hood.ambiance?.trim().toLowerCase() ?? "";
    if (!value) return false;
    return ambiances.some((ambiance) =>
      AMBIANCE_TO_NEIGHBORHOOD[ambiance].some((token) => value.includes(token)),
    );
  });
}

export function buildMapAroundYouItems(input: {
  city: string;
  events: MapEventItem[];
  places: MapCulturalPlaceItem[];
  origin: { latitude: number; longitude: number } | null;
  limit?: number;
}): MapAroundYouItem[] {
  const { city, events, places, origin, limit = 8 } = input;
  if (!origin) {
    return [];
  }

  const eventItems: MapAroundYouItem[] = events.map((event) => ({
    kind: "event",
    id: event.id,
    title: event.title,
    subtitle: event.location_name,
    imageUrl: null,
    distanceMeters: haversineMeters(
      origin.latitude,
      origin.longitude,
      event.latitude,
      event.longitude,
    ),
    meta: mapEventPopupDate(event),
    href: buildMapEventUrl(event.id, { city }),
  }));

  const placeItems: MapAroundYouItem[] = places.map((place) => ({
    kind: "place",
    id: place.id,
    slug: place.slug,
    title: place.name,
    subtitle: place.address,
    imageUrl: resolveMapPlaceImageUrl({
      hero_image_url: null,
      image_url: place.image_url,
      thumbnail_image_url: place.thumbnail_image_url,
    }),
    distanceMeters: haversineMeters(
      origin.latitude,
      origin.longitude,
      place.latitude,
      place.longitude,
    ),
    meta: culturalPlaceCategoryLabel(place.category),
    href: buildMapPlaceUrl(place.slug, { city }),
  }));

  return [...eventItems, ...placeItems]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

export const DEFAULT_MAP_PORTAL_FILTERS: MapPortalFilters = {
  category: "all",
  openNow: false,
  maxDistanceKm: 5,
  ambiances: [],
};
