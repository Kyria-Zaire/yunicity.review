import type {
  CulturalPlaceListItem,
  MapCulturalPlaceItem,
  MapEventItem,
  Neighborhood,
  Tribe,
} from "@yunicity/types";

import { resolveCityMapCenter } from "./map-city-defaults";
import { buildMapEventUrl, buildMapNeighborhoodUrl, buildMapPlaceUrl } from "./explorer-links";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";
import { neighborhoodHref } from "./neighborhood-labels";
import { mapEventPopupDate, mapEventPopupLocation } from "./map-labels";
import { resolveMapPlaceImageUrl } from "./map-media-url";

export const MAP_TERRITORY_LAYERS = [
  "all",
  "moments",
  "lieux",
  "quartiers",
  "tribus",
  "transports",
] as const;

export type MapTerritoryLayer = (typeof MAP_TERRITORY_LAYERS)[number];

const LAYER_URL_SLUG: Record<MapTerritoryLayer, string> = {
  all: "tous",
  moments: "moments",
  lieux: "lieux",
  quartiers: "quartiers",
  tribus: "tribus",
  transports: "transports",
};

const URL_SLUG_TO_LAYER: Record<string, MapTerritoryLayer> = Object.fromEntries(
  (Object.entries(LAYER_URL_SLUG) as [MapTerritoryLayer, string][]).map(([layer, slug]) => [
    slug,
    layer,
  ]),
) as Record<string, MapTerritoryLayer>;

/** Bornes élargies Reims / Grand Reims — rejette 0,0 et coords absurdes. */
const REIMS_LAT_MIN = 49.05;
const REIMS_LAT_MAX = 49.45;
const REIMS_LON_MIN = 3.75;
const REIMS_LON_MAX = 4.35;

export type MapLayerVisibility = {
  showEvents: boolean;
  showPlaces: boolean;
  showNeighborhoods: boolean;
  showTribes: boolean;
  emphasizeTransit: boolean;
};

export type MapNeighborhoodMarker = {
  id: string;
  slug: string;
  name: string;
  ambiance: string;
  latitude: number;
  longitude: number;
};

export type MapTribeMarker = {
  id: string;
  slug: string;
  name: string;
  theme: string;
  description: string;
  latitude: number;
  longitude: number;
  anchorLabel: string;
  anchorKind: "neighborhood" | "city";
  isApproximate: boolean;
};

export type MapTerritorySelection =
  | { kind: "event"; id: string }
  | { kind: "place"; slug: string }
  | { kind: "neighborhood"; slug: string }
  | { kind: "tribe"; slug: string };

export type MapSelectedPanelPayload =
  | {
      kind: "event";
      title: string;
      meta: string;
      location: string;
      href: string;
      routeHref: string;
    }
  | {
      kind: "place";
      title: string;
      meta: string;
      imageUrl: string | null;
      credit: string | null;
      href: string;
      routeSlug: string;
    }
  | {
      kind: "neighborhood";
      title: string;
      meta: string;
      href: string;
      momentsHref: string;
      approximateNote: string | null;
    }
  | {
      kind: "tribe";
      title: string;
      meta: string;
      description: string;
      anchorLabel: string;
      href: string;
    };

export type MapNeighborhoodAmbianceItem = {
  id: string;
  name: string;
  line: string;
  href: string;
};

const BANNED_METRIC_PATTERN =
  /online|trending|viral|heatmap|\d+\s*(membres|users?|personnes|participants)/i;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function mapLayerToUrlSlug(layer: MapTerritoryLayer): string {
  return LAYER_URL_SLUG[layer];
}

export function parseMapLayer(raw: string | null | undefined): MapTerritoryLayer {
  const slug = raw?.trim().toLowerCase() ?? "";
  if (!slug || slug === "tous" || slug === "all") return "all";
  return URL_SLUG_TO_LAYER[slug] ?? "all";
}

export function buildMapLayerUrl(
  layer: MapTerritoryLayer,
  options?: { city?: string | null },
): string {
  const params = new URLSearchParams();
  if (layer !== "all") {
    params.set("layer", mapLayerToUrlSlug(layer));
  }
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  const query = params.toString();
  return query ? `/map?${query}` : "/map";
}

export function isRealMapCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  if (latitude == null || longitude == null) return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude === 0 && longitude === 0) return false;
  if (latitude < REIMS_LAT_MIN || latitude > REIMS_LAT_MAX) return false;
  if (longitude < REIMS_LON_MIN || longitude > REIMS_LON_MAX) return false;
  return true;
}

export function resolveMapLayerVisibility(layer: MapTerritoryLayer): MapLayerVisibility {
  switch (layer) {
    case "moments":
      return {
        showEvents: true,
        showPlaces: false,
        showNeighborhoods: false,
        showTribes: false,
        emphasizeTransit: false,
      };
    case "lieux":
      return {
        showEvents: false,
        showPlaces: true,
        showNeighborhoods: false,
        showTribes: false,
        emphasizeTransit: false,
      };
    case "quartiers":
      return {
        showEvents: false,
        showPlaces: false,
        showNeighborhoods: true,
        showTribes: false,
        emphasizeTransit: false,
      };
    case "tribus":
      return {
        showEvents: false,
        showPlaces: false,
        showNeighborhoods: false,
        showTribes: true,
        emphasizeTransit: false,
      };
    case "transports":
      return {
        showEvents: false,
        showPlaces: false,
        showNeighborhoods: false,
        showTribes: false,
        emphasizeTransit: true,
      };
    default:
      return {
        showEvents: true,
        showPlaces: true,
        showNeighborhoods: true,
        showTribes: true,
        emphasizeTransit: false,
      };
  }
}

export function buildNeighborhoodMapMarkers(
  neighborhoods: Neighborhood[],
): MapNeighborhoodMarker[] {
  return neighborhoods
    .filter((hood) => hood.is_active)
    .filter((hood) => isRealMapCoordinate(hood.latitude, hood.longitude))
    .map((hood) => ({
      id: hood.id,
      slug: hood.slug,
      name: hood.display_name,
      ambiance: hood.ambiance?.trim() || hood.short_description?.trim() || "Un quartier à explorer",
      latitude: hood.latitude as number,
      longitude: hood.longitude as number,
    }));
}

function matchTribeNeighborhood(tribe: Tribe, neighborhoods: Neighborhood[]): Neighborhood | null {
  const key = normalize(tribe.slug);
  return (
    neighborhoods.find((hood) => key.includes(normalize(hood.slug))) ??
    neighborhoods.find((hood) =>
      normalize(tribe.description).includes(normalize(hood.display_name)),
    ) ??
    null
  );
}

export function buildTribeMapMarkers(input: {
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  city: string;
}): MapTribeMarker[] {
  const city = input.city.trim() || "Reims";
  const center = resolveCityMapCenter(city);
  const markers: MapTribeMarker[] = [];

  for (const tribe of input.tribes) {
    if (tribe.is_archived) continue;

    const matched = matchTribeNeighborhood(tribe, input.neighborhoods);
    if (matched && isRealMapCoordinate(matched.latitude, matched.longitude)) {
      markers.push({
        id: tribe.id,
        slug: tribe.slug,
        name: tribe.name,
        theme: tribeCategoryLabel(tribe.category),
        description: tribe.description,
        latitude: matched.latitude as number,
        longitude: matched.longitude as number,
        anchorLabel: matched.display_name,
        anchorKind: "neighborhood",
        isApproximate: false,
      });
      continue;
    }

    if (!matched) {
      markers.push({
        id: tribe.id,
        slug: tribe.slug,
        name: tribe.name,
        theme: tribeCategoryLabel(tribe.category),
        description: tribe.description,
        latitude: center.latitude,
        longitude: center.longitude,
        anchorLabel: city,
        anchorKind: "city",
        isApproximate: true,
      });
    }
  }

  return markers;
}

export function filterEventsForMapLayer(
  events: MapEventItem[],
  visibility: MapLayerVisibility,
): MapEventItem[] {
  return visibility.showEvents ? events : [];
}

export function filterPlacesForMapLayer(
  places: MapCulturalPlaceItem[],
  visibility: MapLayerVisibility,
): MapCulturalPlaceItem[] {
  return visibility.showPlaces ? places : [];
}

export function filterNeighborhoodMarkersForLayer(
  markers: MapNeighborhoodMarker[],
  visibility: MapLayerVisibility,
): MapNeighborhoodMarker[] {
  return visibility.showNeighborhoods ? markers : [];
}

export function filterTribeMarkersForLayer(
  markers: MapTribeMarker[],
  visibility: MapLayerVisibility,
): MapTribeMarker[] {
  return visibility.showTribes ? markers : [];
}

export function buildNeighborhoodAmbianceRailItems(
  neighborhoods: Neighborhood[],
  maxItems = 3,
): MapNeighborhoodAmbianceItem[] {
  const ranked = [...neighborhoods]
    .filter((hood) => hood.is_active)
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      const aText = (a.ambiance ?? a.short_description ?? "").length;
      const bText = (b.ambiance ?? b.short_description ?? "").length;
      return bText - aText;
    });

  return ranked.slice(0, maxItems).map((hood) => ({
    id: hood.id,
    name: hood.display_name,
    line: hood.ambiance?.trim() || hood.short_description?.trim() || "Ambiance locale à découvrir",
    href: neighborhoodHref(hood.slug, hood.city),
  }));
}

export function buildMapSelectedPanelPayload(input: {
  selection: MapTerritorySelection;
  city: string;
  events: MapEventItem[];
  placesBySlug: Map<string, CulturalPlaceListItem | MapCulturalPlaceItem>;
  neighborhoods: Neighborhood[];
  tribeMarkers: MapTribeMarker[];
}): MapSelectedPanelPayload | null {
  const city = input.city.trim() || "Reims";
  const { selection } = input;

  if (selection.kind === "event") {
    const event = input.events.find((item) => item.id === selection.id);
    if (!event) return null;
    return {
      kind: "event",
      title: event.title,
      meta: mapEventPopupDate(event),
      location: mapEventPopupLocation(event),
      href: `/events/${encodeURIComponent(event.id)}`,
      routeHref: buildMapEventUrl(event.id, { city, route: true }),
    };
  }

  if (selection.kind === "place") {
    const place = input.placesBySlug.get(selection.slug);
    if (!place) return null;
    const credit = place.image_credit ?? place.photo_credit ?? null;
    return {
      kind: "place",
      title: place.name,
      meta: place.category,
      imageUrl: resolveMapPlaceImageUrl(place) ?? null,
      credit,
      href: buildMapPlaceUrl(place.slug, { city }),
      routeSlug: place.slug,
    };
  }

  if (selection.kind === "neighborhood") {
    const hood = input.neighborhoods.find((item) => item.slug === selection.slug);
    if (!hood) return null;
    const hasCoords = isRealMapCoordinate(hood.latitude, hood.longitude);
    return {
      kind: "neighborhood",
      title: hood.display_name,
      meta: hood.ambiance?.trim() || hood.short_description?.trim() || "Quartier local",
      href: neighborhoodHref(hood.slug, city),
      momentsHref: `/events?city=${encodeURIComponent(city)}`,
      approximateNote: hasCoords ? null : "Repère non positionné sur la carte.",
    };
  }

  if (selection.kind === "tribe") {
    const marker = input.tribeMarkers.find((item) => item.slug === selection.slug);
    if (!marker) return null;
    return {
      kind: "tribe",
      title: marker.name,
      meta: marker.theme,
      description: marker.description,
      anchorLabel:
        marker.anchorKind === "neighborhood"
          ? `Ancrage quartier — ${marker.anchorLabel}`
          : "Ancrage éditorial — centre-ville",
      href: tribeHref(marker.slug, city),
    };
  }

  return null;
}

export function resolveRouteTargetFromNeighborhood(
  hood: Neighborhood,
): CulturalPlaceListItem | null {
  if (!isRealMapCoordinate(hood.latitude, hood.longitude)) return null;
  return {
    id: `neighborhood-${hood.id}`,
    slug: `neighborhood-${hood.slug}`,
    name: hood.display_name,
    short_description: hood.short_description ?? "Quartier local",
    city: hood.city,
    address: hood.display_name,
    category: "neighborhood",
    latitude: hood.latitude as number,
    longitude: hood.longitude as number,
    image_url: hood.cover_image_url,
    hero_image_url: hood.cover_image_url,
    thumbnail_image_url: hood.cover_image_url,
    gallery_images: [],
    editorial_excerpt: hood.ambiance,
    photo_credit: null,
    image_source: null,
    image_alt: null,
    source_name: "Yunicity",
    image_credit: null,
    neighborhood: { slug: hood.slug, display_name: hood.display_name },
  };
}

export function resolveRouteTargetFromTribeMarker(
  marker: MapTribeMarker,
  city: string,
): CulturalPlaceListItem {
  return {
    id: `tribe-${marker.id}`,
    slug: `tribe-${marker.slug}`,
    name: marker.name,
    short_description: marker.theme,
    city,
    address: marker.anchorLabel,
    category: "tribe",
    latitude: marker.latitude,
    longitude: marker.longitude,
    image_url: null,
    hero_image_url: null,
    thumbnail_image_url: null,
    gallery_images: [],
    editorial_excerpt: marker.description,
    photo_credit: null,
    image_source: null,
    image_alt: null,
    source_name: "Yunicity",
    image_credit: null,
    neighborhood: null,
  };
}

export function buildMapTribeUrl(
  slug: string,
  options?: { city?: string | null },
): string {
  const params = new URLSearchParams();
  const clean = slug.trim();
  if (clean) params.set("tribe", clean);
  const city = options?.city?.trim();
  if (city) params.set("city", city);
  return `/map?${params.toString()}`;
}

export function mapLivingTerritoryHasNoFakeMetrics(texts: string[]): boolean {
  return texts.every((text) => !BANNED_METRIC_PATTERN.test(text));
}
