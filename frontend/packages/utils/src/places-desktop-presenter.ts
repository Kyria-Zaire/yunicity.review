import type { CulturalPlaceListItem } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import {
  NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY_JEAN_JAURES,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE,
  NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI,
} from "./editorial-fallback-images";
import { haversineMeters } from "./map-portal";
import { formatTerritorialLine, neighborhoodHref } from "./neighborhood-labels";
import {
  buildPlaceHref,
  placesCategoryBadgeTone,
  type PlacesCategoryFilterId,
} from "./places-portal";

export type PlacesDesktopNavId = "all" | "nearby" | "saved" | "visited";

export type PlacesDesktopChipOption = {
  id: PlacesCategoryFilterId;
  label: string;
};

export type PlacesDesktopCategoryOption = {
  id: PlacesCategoryFilterId;
  label: string;
};

export type PlacesDesktopSpotlightCard = {
  id: string;
  title: string;
  subtitle: string;
  locationLine: string;
  categoryBadge: string;
  categoryTone: string;
  tags: string[];
  imageUrl: string | null;
  href: string;
  mapHref: string;
};

export type PlacesDesktopSelectionCard = {
  id: string;
  title: string;
  categoryBadge: string;
  categoryTone: string;
  locationLine: string;
  description: string;
  imageUrl: string | null;
  href: string;
  mapHref: string;
};

export type PlacesDesktopDiscoverRow = {
  id: string;
  title: string;
  metaLine: string;
  imageUrl: string | null;
  href: string;
};

export type PlacesDesktopQuartierTile = {
  slug: string;
  label: string;
  imageUrl: string;
  href: string;
};

export type PlacesDesktopAroundMarker = {
  id: string;
  label: string;
  imageUrl: string | null;
  href: string;
  leftPct: number;
  topPct: number;
};

export type PlacesDesktopAroundPreview = {
  illustrationUrl: string;
  mapHref: string;
  markers: PlacesDesktopAroundMarker[];
};

const NEARBY_RADIUS_METERS = 5_000;

const DESKTOP_QUARTIER_TILES: Array<{ slug: string; label: string; imageUrl: string }> = [
  { slug: "centre-ville", label: "Centre-ville", imageUrl: NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE },
  { slug: "saint-remi", label: "Saint-Remi", imageUrl: NEIGHBORHOOD_EDITORIAL_IMAGE_SAINT_REMI },
  {
    slug: "cernay-jean-jaures",
    label: "Cernay – Jean-Jaurès",
    imageUrl: NEIGHBORHOOD_EDITORIAL_IMAGE_CERNAY_JEAN_JAURES,
  },
  { slug: "croix-rouge", label: "Croix-Rouge", imageUrl: NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE },
];

const HERITAGE_CATEGORIES = new Set(["cathedral", "monument", "heritage", "library"]);

function buildPlaceLocationLine(place: CulturalPlaceListItem, city: string): string {
  return (
    formatTerritorialLine(place.neighborhood, city, place.address.split(",")[0]?.trim()) ??
    place.address ??
    city
  );
}

function buildPlaceMapHref(place: CulturalPlaceListItem, city: string): string {
  return `/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(city)}`;
}

function buildPlaceDescription(place: CulturalPlaceListItem): string {
  const excerpt = place.editorial_excerpt?.trim();
  if (excerpt) return excerpt;
  const short = place.short_description?.trim();
  if (short) return short;
  return "Un repère local à découvrir près de chez vous.";
}

function buildPlaceTags(place: CulturalPlaceListItem): string[] {
  const primary = culturalPlaceCategoryLabel(place.category);
  const tags = [primary];
  if (HERITAGE_CATEGORIES.has(place.category) && primary.toLowerCase() !== "patrimoine") {
    tags.push("Patrimoine");
  }
  return tags.slice(0, 2);
}

function toSelectionCard(place: CulturalPlaceListItem, city: string): PlacesDesktopSelectionCard {
  return {
    id: place.id,
    title: place.name,
    categoryBadge: culturalPlaceCategoryLabel(place.category).toUpperCase(),
    categoryTone: placesCategoryBadgeTone(place.category),
    locationLine: buildPlaceLocationLine(place, city),
    description: buildPlaceDescription(place),
    imageUrl: resolveCulturalPlaceDisplayUrl(place, "thumbnail"),
    href: buildPlaceHref(place, city),
    mapHref: buildPlaceMapHref(place, city),
  };
}

export function buildPlacesDesktopSpotlight(
  places: CulturalPlaceListItem[],
  city: string,
): PlacesDesktopSpotlightCard | null {
  const place = places[0];
  if (!place) return null;

  return {
    id: place.id,
    title: place.name,
    subtitle: buildPlaceDescription(place),
    locationLine: buildPlaceLocationLine(place, city),
    categoryBadge: culturalPlaceCategoryLabel(place.category).toUpperCase(),
    categoryTone: placesCategoryBadgeTone(place.category),
    tags: buildPlaceTags(place),
    imageUrl: resolveCulturalPlaceDisplayUrl(place, "hero"),
    href: buildPlaceHref(place, city),
    mapHref: buildPlaceMapHref(place, city),
  };
}

export function buildPlacesDesktopSelectionCards(input: {
  places: CulturalPlaceListItem[];
  city: string;
  excludeId?: string | null;
  limit?: number;
}): PlacesDesktopSelectionCard[] {
  const { places, city, excludeId, limit = 3 } = input;
  return places
    .filter((place) => place.id !== excludeId)
    .slice(0, limit)
    .map((place) => toSelectionCard(place, city));
}

export function buildPlacesDesktopDiscoverRows(input: {
  places: CulturalPlaceListItem[];
  city: string;
  limit?: number;
}): PlacesDesktopDiscoverRow[] {
  const { places, city, limit = 4 } = input;
  return places.slice(0, limit).map((place) => ({
    id: place.id,
    title: place.name,
    metaLine: `${culturalPlaceCategoryLabel(place.category)} · ${place.neighborhood?.display_name ?? city}`,
    imageUrl: resolveCulturalPlaceDisplayUrl(place, "thumbnail"),
    href: buildPlaceHref(place, city),
  }));
}

export function buildPlacesDesktopQuartierTiles(city: string): PlacesDesktopQuartierTile[] {
  return DESKTOP_QUARTIER_TILES.map((tile) => ({
    ...tile,
    href: neighborhoodHref(tile.slug, city),
  }));
}

export function filterPlacesByDesktopNav(
  places: CulturalPlaceListItem[],
  navId: PlacesDesktopNavId,
  userCoords: { lat: number; lon: number } | null,
): CulturalPlaceListItem[] {
  if (navId === "saved" || navId === "visited") {
    return [];
  }
  if (navId !== "nearby" || !userCoords) {
    return places;
  }
  return places
    .map((place) => ({
      place,
      distance: haversineMeters(userCoords.lat, userCoords.lon, place.latitude, place.longitude),
    }))
    .filter((entry) => entry.distance <= NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.place);
}

function clampPct(value: number): number {
  return Math.min(82, Math.max(14, value));
}

function buildAroundMarkerPosition(
  userCoords: { lat: number; lon: number },
  place: CulturalPlaceListItem,
  index: number,
): { leftPct: number; topPct: number } {
  const lonDelta = (place.longitude - userCoords.lon) * 12_000;
  const latDelta = (userCoords.lat - place.latitude) * 12_000;
  const fallbackPositions = [
    { leftPct: 24, topPct: 28 },
    { leftPct: 62, topPct: 38 },
    { leftPct: 42, topPct: 62 },
  ];
  const fallback = fallbackPositions[index] ?? { leftPct: 50, topPct: 50 };
  return {
    leftPct: clampPct(50 + lonDelta + (fallback.leftPct - 50) * 0.15),
    topPct: clampPct(48 + latDelta + (fallback.topPct - 50) * 0.15),
  };
}

export function buildPlacesDesktopAroundPreview(input: {
  city: string;
  places: CulturalPlaceListItem[];
  userCoords: { lat: number; lon: number } | null;
  geolocationEnabled: boolean;
}): PlacesDesktopAroundPreview {
  const { city, places, userCoords, geolocationEnabled } = input;
  const illustrationUrl = NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE;
  const mapHref =
    geolocationEnabled && userCoords
      ? `/map?city=${encodeURIComponent(city)}&lat=${userCoords.lat}&lon=${userCoords.lon}`
      : placesDesktopMapHref(city);

  if (!geolocationEnabled || !userCoords) {
    return { illustrationUrl, mapHref, markers: [] };
  }

  const markers = places
    .map((place) => ({
      place,
      distance: haversineMeters(userCoords.lat, userCoords.lon, place.latitude, place.longitude),
    }))
    .filter((entry) => entry.distance <= NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ place }, index) => {
      const position = buildAroundMarkerPosition(userCoords, place, index);
      return {
        id: place.id,
        label: place.name,
        imageUrl: resolveCulturalPlaceDisplayUrl(place, "thumbnail"),
        href: buildPlaceHref(place, city),
        ...position,
      };
    });

  return { illustrationUrl, mapHref, markers };
}

export function placesDesktopMapHref(city: string): string {
  return `/map?city=${encodeURIComponent(city)}`;
}

export function placesDesktopNeighborhoodsHref(city: string): string {
  return `/neighborhoods?city=${encodeURIComponent(city)}`;
}

export function placesDesktopProposeHref(): string {
  return "/organizations/request";
}
