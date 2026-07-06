import type { CulturalPlaceListItem } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import { buildPlaceHref, formatPlaceOpenedLabel, formatPlaceTrustLine } from "./places-portal";
import { haversineMeters } from "./map-portal";

/** Catégories pills mobile Lieux (MOBILE-LIEUX-01). */
export type PlacesMobileCategoryId =
  | "all"
  | "restaurants"
  | "bars_cafe"
  | "culture"
  | "shopping"
  | "services"
  | "health";

export type PlacesMobilePlaceCard = {
  id: string;
  name: string;
  categoryLabel: string;
  neighborhoodName: string;
  metaLine: string;
  distanceLabel: string | null;
  imageUrl: string | null;
  href: string;
  badge: string | null;
};

export type PlacesMobileTopRatedRow = PlacesMobilePlaceCard & {
  rank: number;
};

const RESTAURANT_PATTERN = /restaurant|gastro|brasserie|bistro/i;
const BAR_CAFE_PATTERN = /cafe|café|bar|brasserie|boulangerie/i;
const SHOPPING_PATTERN = /market|shop|commerce|boutique|winery|store/i;
const SERVICE_PATTERN = /service|sport|library|theatre|square|monument|heritage|cathedral/i;
const HEALTH_PATTERN = /health|santé|pharmacy|pharmacie|medical/i;
const CULTURE_PATTERN = /museum|library|theatre|culture|heritage|monument|cathedral/i;

function formatPlacesMobileDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function buildPlacesMobileMetaLine(place: CulturalPlaceListItem): string {
  const opened = formatPlaceOpenedLabel(place.created_at);
  const trust = formatPlaceTrustLine(place);
  return opened ?? trust;
}

function toPlacesMobilePlaceCard(
  place: CulturalPlaceListItem,
  city: string,
  distanceLabel: string | null,
  badge: string | null,
): PlacesMobilePlaceCard {
  return {
    id: place.id,
    name: place.name,
    categoryLabel: culturalPlaceCategoryLabel(place.category),
    neighborhoodName: place.neighborhood?.display_name ?? city,
    metaLine: buildPlacesMobileMetaLine(place),
    distanceLabel,
    imageUrl: resolveCulturalPlaceDisplayUrl(place, "thumbnail"),
    href: buildPlaceHref(place, city),
    badge,
  };
}

export function filterPlacesByMobileCategory(
  places: CulturalPlaceListItem[],
  category: PlacesMobileCategoryId,
): CulturalPlaceListItem[] {
  if (category === "all") {
    return places;
  }

  return places.filter((place) => {
    const categoryValue = place.category.toLowerCase();
    const label = culturalPlaceCategoryLabel(place.category).toLowerCase();

    switch (category) {
      case "restaurants":
        return RESTAURANT_PATTERN.test(categoryValue) || RESTAURANT_PATTERN.test(label);
      case "bars_cafe":
        return BAR_CAFE_PATTERN.test(categoryValue) || BAR_CAFE_PATTERN.test(label);
      case "culture":
        return CULTURE_PATTERN.test(categoryValue) || CULTURE_PATTERN.test(label);
      case "shopping":
        return SHOPPING_PATTERN.test(categoryValue) || SHOPPING_PATTERN.test(label);
      case "services":
        return SERVICE_PATTERN.test(categoryValue) || SERVICE_PATTERN.test(label);
      case "health":
        return HEALTH_PATTERN.test(categoryValue) || HEALTH_PATTERN.test(label);
      default:
        return true;
    }
  });
}

export function buildPlacesMobileNearbyCards(input: {
  places: CulturalPlaceListItem[];
  city: string;
  userCoords: { lat: number; lon: number } | null;
  maxItems?: number;
}): PlacesMobilePlaceCard[] {
  const maxItems = input.maxItems ?? 8;
  const ranked = input.places
    .map((place) => {
      if (
        input.userCoords == null ||
        place.latitude == null ||
        place.longitude == null
      ) {
        return { place, distance: null as number | null };
      }
      return {
        place,
        distance: haversineMeters(
          input.userCoords.lat,
          input.userCoords.lon,
          place.latitude,
          place.longitude,
        ),
      };
    })
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) {
        return a.distance - b.distance;
      }
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return a.place.name.localeCompare(b.place.name, "fr");
    });

  return ranked.slice(0, maxItems).map(({ place, distance }) =>
    toPlacesMobilePlaceCard(
      place,
      input.city,
      distance != null ? formatPlacesMobileDistance(distance) : null,
      null,
    ),
  );
}

export function buildPlacesMobileTrendingCards(input: {
  places: CulturalPlaceListItem[];
  city: string;
  newBadgeIds: Set<string>;
  maxItems?: number;
}): PlacesMobilePlaceCard[] {
  const pool = [...input.places].sort((a, b) => {
    const aFeatured = a.is_featured === true ? 1 : 0;
    const bFeatured = b.is_featured === true ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    return a.name.localeCompare(b.name, "fr");
  });

  return pool.slice(0, input.maxItems ?? 8).map((place) => {
    let badge: string | null = null;
    if (input.newBadgeIds.has(place.id)) {
      badge = "Nouveau";
    } else if (place.is_featured) {
      badge = "À la une";
    }
    return toPlacesMobilePlaceCard(place, input.city, null, badge);
  });
}

export function buildPlacesMobileTopRatedRows(input: {
  places: CulturalPlaceListItem[];
  city: string;
  maxItems?: number;
}): PlacesMobileTopRatedRow[] {
  const pool = [...input.places]
    .filter((place) => place.is_featured === true)
    .concat(input.places.filter((place) => place.is_featured !== true))
    .slice(0, input.maxItems ?? 5);

  return pool.map((place, index) => ({
    ...toPlacesMobilePlaceCard(place, input.city, null, null),
    rank: index + 1,
  }));
}

export function filterPlacesMobileCardsByQuery(
  items: PlacesMobilePlaceCard[],
  query: string,
): PlacesMobilePlaceCard[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) ||
      item.categoryLabel.toLowerCase().includes(needle) ||
      item.neighborhoodName.toLowerCase().includes(needle) ||
      item.metaLine.toLowerCase().includes(needle),
  );
}
