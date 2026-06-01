/** Explorer landing — agrégation réelle (lieux, moments, quartiers). */

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  Tribe,
} from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import { formatEventDateRange } from "./event-labels";
/** Hero Explorer — visuel éditorial Reims (place Drouet-d'Erlon). */
export const EXPLORER_EDITORIAL_HERO_IMAGE_URL =
  "https://www.uncoupleenvadrouille.fr/wp-content/uploads/2019/08/Place-Drouet-dErlon-avec-monument-%C3%A0-reims-1140x760.jpg";
import { buildMapEventUrl, buildMapPlaceUrl } from "./explorer-links";
import { filterPlacesByCategoryGroup, type PlacesCategoryFilterId } from "./places-portal";
import { resolveEventHeroImage } from "./event-hero-image";
import {
  SEARCH_EXPLORER_EVENTS_COUNT,
  SEARCH_EXPLORER_PLACES_COUNT,
} from "./search-explorer-portal-labels";

export type ExplorerCategoryId =
  | "all"
  | "culture"
  | "nature"
  | "gastronomy"
  | "sport"
  | "music"
  | "events"
  | "heritage"
  | "leisure"
  | "shopping";

export type ExplorerNavCategory = {
  id: ExplorerCategoryId;
  label: string;
  icon: string;
  /** Filtre lieux ; `events` = pas de filtre lieu. */
  placeFilterId?: PlacesCategoryFilterId;
};

export const EXPLORER_NAV_CATEGORIES: ExplorerNavCategory[] = [
  { id: "all", label: "Tous", icon: "grid" },
  { id: "culture", label: "Culture", icon: "palette", placeFilterId: "culture" },
  { id: "nature", label: "Nature", icon: "leaf", placeFilterId: "nature" },
  { id: "gastronomy", label: "Gastronomie", icon: "utensils", placeFilterId: "gastronomy" },
  { id: "sport", label: "Sport", icon: "activity", placeFilterId: "sport" },
  { id: "music", label: "Musique", icon: "music", placeFilterId: "culture" },
  { id: "events", label: "Événements", icon: "calendar" },
  { id: "heritage", label: "Patrimoine", icon: "landmark", placeFilterId: "heritage" },
  { id: "leisure", label: "Loisirs", icon: "sparkles", placeFilterId: "leisure" },
  { id: "shopping", label: "Shopping", icon: "bag", placeFilterId: "gastronomy" },
];

export type ExplorerCategoryCard = {
  id: ExplorerCategoryId;
  label: string;
  countLabel: string;
  href: string;
};

export type ExplorerSuggestionCard = {
  id: string;
  kind: "place" | "event";
  title: string;
  subtitle: string;
  location: string;
  badge: string;
  imageUrl: string | null;
  href: string;
  metaLine?: string;
};

export type ExplorerTrendLine = {
  id: string;
  label: string;
  href: string;
};

const UPCOMING = (events: LocalEvent[]) => {
  const now = Date.now();
  return events
    .filter((e) => !e.is_cancelled && new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
};

/** Image fixe du bandeau landing — indépendante du pick événement/lieu du jour. */
export function resolveExplorerHeroImageUrl(
  _events: LocalEvent[],
  _culturalPlaces: CulturalPlaceListItem[],
): string {
  return EXPLORER_EDITORIAL_HERO_IMAGE_URL;
}

export function countPlacesForExplorerCategory(
  catalog: CulturalPlaceListItem[],
  categoryId: ExplorerCategoryId,
): number {
  if (categoryId === "all") return catalog.length;
  if (categoryId === "events") return 0;
  const nav = EXPLORER_NAV_CATEGORIES.find((c) => c.id === categoryId);
  if (!nav?.placeFilterId || nav.placeFilterId === "all") {
    return catalog.length;
  }
  return filterPlacesByCategoryGroup(catalog, nav.placeFilterId).length;
}

export function buildExplorerCategoryCards(
  catalog: CulturalPlaceListItem[],
  upcomingEventCount: number,
  city: string,
): ExplorerCategoryCard[] {
  const cards: ExplorerCategoryCard[] = EXPLORER_NAV_CATEGORIES.filter(
    (c) => c.id !== "all" && c.id !== "events",
  ).map((nav) => {
    const count = countPlacesForExplorerCategory(catalog, nav.id);
    const params = new URLSearchParams({ city });
    if (nav.placeFilterId && nav.placeFilterId !== "all") {
      params.set("category", nav.placeFilterId);
    }
    return {
      id: nav.id,
      label: nav.label,
      countLabel: SEARCH_EXPLORER_PLACES_COUNT(count),
      href: `/places?${params.toString()}`,
    };
  });

  cards.push({
    id: "events",
    label: "Événements",
    countLabel: SEARCH_EXPLORER_EVENTS_COUNT(upcomingEventCount),
    href: `/events?city=${encodeURIComponent(city)}`,
  });

  return cards;
}

export function filterCatalogForExplorerCategory(
  catalog: CulturalPlaceListItem[],
  categoryId: ExplorerCategoryId,
): CulturalPlaceListItem[] {
  if (categoryId === "all" || categoryId === "events") return catalog;
  const nav = EXPLORER_NAV_CATEGORIES.find((c) => c.id === categoryId);
  if (!nav?.placeFilterId) return catalog;
  return filterPlacesByCategoryGroup(catalog, nav.placeFilterId);
}

export function buildExplorerSuggestions(input: {
  city: string;
  catalog: CulturalPlaceListItem[];
  events: LocalEvent[];
  categoryId: ExplorerCategoryId;
  limit?: number;
}): ExplorerSuggestionCard[] {
  const limit = input.limit ?? 8;
  const cards: ExplorerSuggestionCard[] = [];

  if (input.categoryId === "events" || input.categoryId === "all") {
    for (const event of UPCOMING(input.events).slice(0, input.categoryId === "events" ? limit : 4)) {
      cards.push({
        id: `event-${event.id}`,
        kind: "event",
        title: event.title,
        subtitle: event.location_name ?? input.city,
        location: input.city,
        badge: "MOMENT",
        imageUrl: resolveEventHeroImage(event, input.catalog),
        href: `/events/${event.id}`,
        metaLine: formatEventDateRange(event.starts_at, event.ends_at),
      });
    }
  }

  if (input.categoryId !== "events") {
    const places = filterCatalogForExplorerCategory(input.catalog, input.categoryId).slice(
      0,
      limit - cards.length,
    );
    for (const place of places) {
      cards.push({
        id: `place-${place.id}`,
        kind: "place",
        title: place.name,
        subtitle: place.short_description ?? culturalPlaceCategoryLabel(place.category),
        location: place.neighborhood?.display_name ?? place.address,
        badge: culturalPlaceCategoryLabel(place.category).toUpperCase(),
        imageUrl: resolveCulturalPlaceDisplayUrl(place, "hero"),
        href: buildMapPlaceUrl(place.slug),
      });
    }
  }

  return cards.slice(0, limit);
}

export function buildExplorerTrendLines(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  neighborhoods: Neighborhood[];
  tribes: Tribe[];
}): ExplorerTrendLine[] {
  const lines: ExplorerTrendLine[] = [];
  const nextEvent = UPCOMING(input.events)[0];
  if (nextEvent) {
    lines.push({
      id: `trend-event-${nextEvent.id}`,
      label: nextEvent.title,
      href: `/events/${nextEvent.id}`,
    });
  }
  const place = input.culturalPlaces[0];
  if (place) {
    lines.push({
      id: `trend-place-${place.id}`,
      label: place.name,
      href: buildMapPlaceUrl(place.slug),
    });
  }
  const hood = input.neighborhoods[0];
  if (hood) {
    lines.push({
      id: `trend-hood-${hood.id}`,
      label: hood.display_name,
      href: `/neighborhoods/${hood.slug}?city=${encodeURIComponent(input.city)}`,
    });
  }
  const tribe = input.tribes[0];
  if (tribe) {
    lines.push({
      id: `trend-tribe-${tribe.id}`,
      label: tribe.name,
      href: `/tribes/${tribe.slug}?city=${encodeURIComponent(input.city)}`,
    });
  }
  if (lines.length < 4) {
    lines.push({
      id: "trend-places",
      label: "Lieux culturels à découvrir",
      href: `/places?city=${encodeURIComponent(input.city)}`,
    });
  }
  return lines.slice(0, 5);
}

export function explorerCategoryHref(
  categoryId: ExplorerCategoryId,
  city: string,
): string {
  if (categoryId === "events") {
    return `/events?city=${encodeURIComponent(city)}`;
  }
  if (categoryId === "all") {
    return `/search?city=${encodeURIComponent(city)}`;
  }
  const nav = EXPLORER_NAV_CATEGORIES.find((c) => c.id === categoryId);
  const params = new URLSearchParams({ city });
  if (nav?.placeFilterId && nav.placeFilterId !== "all") {
    params.set("category", nav.placeFilterId);
  }
  return `/places?${params.toString()}`;
}
