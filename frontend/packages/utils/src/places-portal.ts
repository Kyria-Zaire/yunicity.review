import type { CulturalPlaceListItem, CulturalPlaceSort, CulturalPlaceStatsResponse } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { buildMapPlaceUrl } from "./explorer-links";
import {
  PLACES_PORTAL_STAT_CATEGORIES,
  PLACES_PORTAL_STAT_NEW,
  PLACES_PORTAL_STAT_REVIEWS,
  PLACES_PORTAL_STAT_REVIEWS_SOON,
  PLACES_PORTAL_STAT_TOTAL,
} from "./places-portal-labels";

export type PlacesCategoryFilterId =
  | "all"
  | "culture"
  | "gastronomy"
  | "nature"
  | "leisure"
  | "sport"
  | "heritage"
  | "monument"
  | "square"
  | "market"
  | "winery";

export type PlacesCategoryFilter = {
  id: PlacesCategoryFilterId;
  label: string;
  categories: string[];
};

export const PLACES_CATEGORY_FILTERS: PlacesCategoryFilter[] = [
  { id: "all", label: "Tous", categories: [] },
  {
    id: "culture",
    label: "Culture",
    categories: ["museum", "library", "theatre"],
  },
  {
    id: "gastronomy",
    label: "Gastronomie",
    categories: ["market", "winery"],
  },
  {
    id: "nature",
    label: "Nature",
    categories: ["park"],
  },
  {
    id: "leisure",
    label: "Loisirs",
    categories: ["square", "theatre"],
  },
  {
    id: "sport",
    label: "Sport",
    categories: ["sport"],
  },
  {
    id: "heritage",
    label: "Patrimoine",
    categories: ["cathedral", "monument", "heritage"],
  },
];

/** Filtres affichés dans le menu « Plus ». */
export const PLACES_MORE_CATEGORY_FILTERS: PlacesCategoryFilter[] = [
  { id: "monument", label: "Monuments", categories: ["monument"] },
  { id: "square", label: "Places & squares", categories: ["square"] },
  { id: "market", label: "Marchés", categories: ["market"] },
  { id: "winery", label: "Maisons de champagne", categories: ["winery"] },
];

export const PLACES_VISIBLE_CATEGORY_FILTERS = PLACES_CATEGORY_FILTERS.filter(
  (filter) => !PLACES_MORE_CATEGORY_FILTERS.some((more) => more.id === filter.id),
);

export function isPlacesMoreCategoryActive(categoryFilter: PlacesCategoryFilterId): boolean {
  return PLACES_MORE_CATEGORY_FILTERS.some((filter) => filter.id === categoryFilter);
}

export const PLACES_PAGE_SIZE = 12;
/** Fenêtre d’affichage du badge NOUVEAU sur la grille. */
export const PLACES_NEW_BADGE_DAYS = 7;
export const PLACES_NEW_BADGE_MAX = 4;
/** Libellé « Ajouté il y a … » — fenêtre plus large que le badge. */
export const PLACES_NEW_LABEL_DAYS = 45;

const BANNED_METRIC_PATTERN =
  /leaderboard|classement|#\d+\s*(sur|\/)\s*\d+|note\s*moyenne\s*4[,.]7/i;

export type PlacesPortalStatCard = {
  id: string;
  label: string;
  value: string;
  tone: "blue" | "green" | "orange" | "purple";
};

export function placesPortalHasNoFakeMetrics(texts: string[]): boolean {
  return texts.every((text) => !BANNED_METRIC_PATTERN.test(text));
}

export function buildPlacesPortalStatCards(
  stats: CulturalPlaceStatsResponse | null,
): PlacesPortalStatCard[] {
  return [
    {
      id: "total",
      label: PLACES_PORTAL_STAT_TOTAL,
      value: stats != null ? formatPlacesCount(stats.total_places) : "—",
      tone: "blue",
    },
    {
      id: "new",
      label: PLACES_PORTAL_STAT_NEW,
      value:
        stats != null
          ? stats.new_this_month > 0
            ? formatPlacesCount(stats.new_this_month)
            : "Pas encore"
          : "—",
      tone: "green",
    },
    {
      id: "reviews",
      label: PLACES_PORTAL_STAT_REVIEWS,
      value: PLACES_PORTAL_STAT_REVIEWS_SOON,
      tone: "orange",
    },
    {
      id: "categories",
      label: PLACES_PORTAL_STAT_CATEGORIES,
      value: stats != null ? formatPlacesCount(stats.category_count) : "—",
      tone: "purple",
    },
  ];
}

export function formatPlacesCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.max(0, value));
}

export function resolvePlacesCategoryFilter(id: PlacesCategoryFilterId): PlacesCategoryFilter {
  const found = [...PLACES_CATEGORY_FILTERS, ...PLACES_MORE_CATEGORY_FILTERS].find(
    (filter) => filter.id === id,
  );
  return found ?? PLACES_CATEGORY_FILTERS[0]!;
}

export function filterPlacesByCategoryGroup(
  places: CulturalPlaceListItem[],
  filterId: PlacesCategoryFilterId,
): CulturalPlaceListItem[] {
  const filter = resolvePlacesCategoryFilter(filterId);
  if (filter.id === "all" || filter.categories.length === 0) {
    return places;
  }
  const allowed = new Set(filter.categories);
  return places.filter((place) => allowed.has(place.category));
}

export function filterPlacesBySearch(
  places: CulturalPlaceListItem[],
  query: string,
): CulturalPlaceListItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return places;
  return places.filter((place) => {
    const haystack = [
      place.name,
      place.short_description,
      place.editorial_excerpt ?? "",
      place.address,
      place.neighborhood?.display_name ?? "",
      culturalPlaceCategoryLabel(place.category),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

function placeCreatedAt(place: CulturalPlaceListItem): number {
  const value = Date.parse(place.created_at ?? "");
  return Number.isFinite(value) ? value : 0;
}

function placeIsFeatured(place: CulturalPlaceListItem): boolean {
  return place.is_featured === true;
}

export function sortPlacesLocally(
  places: CulturalPlaceListItem[],
  sort: CulturalPlaceSort,
): CulturalPlaceListItem[] {
  const copy = [...places];
  if (sort === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }
  if (sort === "recent") {
    return copy.sort(
      (a, b) => placeCreatedAt(b) - placeCreatedAt(a) || a.name.localeCompare(b.name, "fr"),
    );
  }
  return copy.sort((a, b) => {
    if (placeIsFeatured(a) !== placeIsFeatured(b)) {
      return placeIsFeatured(a) ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "fr");
  });
}

export function pickFeaturedPlaces(
  places: CulturalPlaceListItem[],
  limit = 8,
): CulturalPlaceListItem[] {
  const featured = places.filter((place) => placeIsFeatured(place));
  const pool = featured.length > 0 ? featured : places;
  return sortPlacesLocally(pool, "featured").slice(0, limit);
}

export function pickRecentPlaces(
  places: CulturalPlaceListItem[],
  limit = 12,
): CulturalPlaceListItem[] {
  return sortPlacesLocally(places, "recent").slice(0, limit);
}

export function isPlaceWithinNewBadgeWindow(
  place: CulturalPlaceListItem,
  now = Date.now(),
): boolean {
  const created = placeCreatedAt(place);
  if (created <= 0) return false;
  return now - created <= PLACES_NEW_BADGE_DAYS * 86_400_000;
}

/** Au plus `PLACES_NEW_BADGE_MAX` badges, lieux créés dans les 7 derniers jours. */
export function selectPlacesNewBadgeIds(
  places: CulturalPlaceListItem[],
  now = Date.now(),
): Set<string> {
  const eligible = places
    .filter((place) => isPlaceWithinNewBadgeWindow(place, now))
    .sort((a, b) => placeCreatedAt(b) - placeCreatedAt(a));
  return new Set(eligible.slice(0, PLACES_NEW_BADGE_MAX).map((place) => place.id));
}

export function shouldShowPlaceNewBadge(
  place: CulturalPlaceListItem,
  newBadgeIds: Set<string>,
): boolean {
  return newBadgeIds.has(place.id);
}

/** @deprecated Utiliser shouldShowPlaceNewBadge avec selectPlacesNewBadgeIds. */
export function isPlaceRecentlyAdded(place: CulturalPlaceListItem, now = Date.now()): boolean {
  return isPlaceWithinNewBadgeWindow(place, now);
}

export function formatPlaceOpenedLabel(createdAt: string | undefined, now = Date.now()): string | null {
  const created = Date.parse(createdAt ?? "");
  if (!Number.isFinite(created)) return null;
  const diffDays = Math.floor((now - created) / 86_400_000);
  if (diffDays > PLACES_NEW_LABEL_DAYS) return null;
  if (diffDays <= 0) return "Ajouté aujourd’hui";
  if (diffDays === 1) return "Ajouté hier";
  if (diffDays < 14) return `Ajouté il y a ${diffDays} jours`;
  const weeks = Math.max(1, Math.floor(diffDays / 7));
  return `Ajouté il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

export function buildPlaceHref(place: CulturalPlaceListItem, city: string): string {
  return buildMapPlaceUrl(place.slug, { city });
}

export function formatPlaceTrustLine(place: CulturalPlaceListItem): string {
  const source = place.source_name?.trim();
  return source && source.length > 0 ? source : "Référence locale";
}

export function buildRecentPlacesList(
  places: CulturalPlaceListItem[],
  limit: number,
): CulturalPlaceListItem[] {
  return pickRecentPlaces(places, limit);
}

export function placesCategoryBadgeTone(category: string): string {
  switch (category) {
    case "market":
    case "winery":
      return "bg-amber-50 text-amber-800";
    case "park":
      return "bg-emerald-50 text-emerald-800";
    case "museum":
    case "library":
    case "theatre":
      return "bg-sky-50 text-sky-800";
    case "cathedral":
    case "monument":
    case "heritage":
      return "bg-violet-50 text-violet-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}
