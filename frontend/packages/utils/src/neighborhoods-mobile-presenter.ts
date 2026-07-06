import type { CulturalPlaceListItem, LocalEvent, Neighborhood, PartnerOfferPublic, Tribe } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import { resolveCulturalPlaceImageOverride } from "./event-hero-image";
import { buildMapPlaceUrl } from "./explorer-links";
import {
  buildNeighborhoodCards,
  filterNeighborhoodCardsByMood,
  type NeighborhoodPortalCard,
  type NeighborhoodPortalMood,
} from "./neighborhood-portal";
import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";
import { neighborhoodHref } from "./neighborhood-labels";
import {
  culturalPlaceBelongsToNeighborhood,
  eventBelongsToNeighborhood,
} from "./neighborhood-atmosphere";

/** Catégories pills mobile Quartiers (MOBILE-QUARTIERS-01). */
export type NeighborhoodsMobileCategoryId =
  | "all"
  | "popular"
  | "culture"
  | "sortir"
  | "famille"
  | "nature";

export type NeighborhoodsMobileMyCard = {
  id: string;
  slug: string;
  name: string;
  city: string;
  imageUrl: string | null;
  statsLine: string;
  href: string;
  badge: "favorite" | "subscribed" | null;
};

export type NeighborhoodsMobileDiscoverSlide = {
  id: string;
  slug: string;
  name: string;
  city: string;
  imageUrl: string | null;
  description: string;
  statsLine: string;
  href: string;
  mapHref: string;
};

export type NeighborhoodsMobileRecommendedPlace = {
  id: string;
  name: string;
  neighborhoodName: string;
  categoryLabel: string;
  imageUrl: string | null;
  href: string;
};

function countHoodPlaces(hood: Neighborhood, places: CulturalPlaceListItem[]): number {
  return places.filter((place) => culturalPlaceBelongsToNeighborhood(place, hood)).length;
}

function countHoodEvents(hood: Neighborhood, events: LocalEvent[]): number {
  return events.filter(
    (event) => !event.is_cancelled && eventBelongsToNeighborhood(event, hood),
  ).length;
}

function buildStatsLine(hood: Neighborhood, events: LocalEvent[], places: CulturalPlaceListItem[]): string {
  const placesCount = countHoodPlaces(hood, places);
  const eventsCount = countHoodEvents(hood, events);
  return `${placesCount} lieu${placesCount > 1 ? "x" : ""} • ${eventsCount} événement${eventsCount > 1 ? "s" : ""}`;
}

export function mapNeighborhoodsMobileCategoryToMood(
  category: NeighborhoodsMobileCategoryId,
): NeighborhoodPortalMood | "" {
  switch (category) {
    case "culture":
      return "culture";
    case "sortir":
      return "sortir";
    case "famille":
      return "famille";
    case "nature":
      return "marcher";
    default:
      return "";
  }
}

export function filterNeighborhoodPortalCardsByMobileCategory(
  cards: NeighborhoodPortalCard[],
  category: NeighborhoodsMobileCategoryId,
  neighborhoods: Neighborhood[],
): NeighborhoodPortalCard[] {
  if (category === "all") {
    return cards;
  }
  if (category === "popular") {
    const featuredSlugs = new Set(
      neighborhoods.filter((hood) => hood.is_featured).map((hood) => hood.slug.trim().toLowerCase()),
    );
    return cards.filter((card) => featuredSlugs.has(card.slug.trim().toLowerCase()));
  }
  const mood = mapNeighborhoodsMobileCategoryToMood(category);
  return mood ? filterNeighborhoodCardsByMood(cards, mood) : cards;
}

export function filterNeighborhoodsMobileByQuery<T extends { name: string; description?: string }>(
  items: T[],
  query: string,
): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(trimmed) ||
      (item.description?.toLowerCase().includes(trimmed) ?? false),
  );
}

export function buildNeighborhoodsMobileMyCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): NeighborhoodsMobileMyCard[] {
  const city = input.city.trim() || "Reims";
  const upcoming = input.events.filter((event) => !event.is_cancelled);
  const featured = input.neighborhoods.filter((hood) => hood.is_active && hood.is_featured);
  const source = featured.length > 0 ? featured : input.neighborhoods.filter((hood) => hood.is_active);

  return source
    .slice(0, input.maxItems ?? 6)
    .map((hood) => ({
      id: hood.id,
      slug: hood.slug,
      name: hood.display_name,
      city: hood.city || city,
      imageUrl: resolveNeighborhoodEditorialImage(hood),
      statsLine: buildStatsLine(hood, upcoming, input.culturalPlaces),
      href: neighborhoodHref(hood.slug, city),
      badge: hood.is_featured ? ("favorite" as const) : null,
    }));
}

export function buildNeighborhoodsMobileDiscoverSlides(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  offers: PartnerOfferPublic[];
  maxItems?: number;
}): NeighborhoodsMobileDiscoverSlide[] {
  const cards = buildNeighborhoodCards({
    city: input.city,
    neighborhoods: input.neighborhoods,
    events: input.events,
    culturalPlaces: input.culturalPlaces,
    tribes: input.tribes,
    offers: input.offers,
  });

  return cards.slice(0, input.maxItems ?? 6).map((card) => {
    const hood = input.neighborhoods.find((item) => item.slug === card.slug);
    const description =
      hood?.short_description?.trim() ||
      card.tagline ||
      card.ambianceLabel;

    return {
      id: card.id,
      slug: card.slug,
      name: card.name,
      city: input.city.trim() || "Reims",
      imageUrl: card.imageUrl,
      description,
      statsLine: hood
        ? buildStatsLine(hood, input.events, input.culturalPlaces)
        : card.ambianceLabel,
      href: card.href,
      mapHref: card.mapHref,
    };
  });
}

export function buildNeighborhoodsMobileRecommendedPlaces(input: {
  city: string;
  culturalPlaces: CulturalPlaceListItem[];
  neighborhoodSlugs?: string[];
  maxItems?: number;
}): NeighborhoodsMobileRecommendedPlace[] {
  const city = input.city.trim() || "Reims";
  const allowed = input.neighborhoodSlugs?.map((slug) => slug.trim().toLowerCase());

  return input.culturalPlaces
    .filter((place) => {
      if (!allowed || allowed.length === 0) return true;
      const slug = place.neighborhood?.slug?.trim().toLowerCase();
      return slug != null && allowed.includes(slug);
    })
    .slice(0, input.maxItems ?? 8)
    .map((place) => ({
      id: place.id,
      name: place.name,
      neighborhoodName: place.neighborhood?.display_name ?? city,
      categoryLabel: culturalPlaceCategoryLabel(place.category),
      imageUrl: resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place),
      href: buildMapPlaceUrl(place.slug, { city }),
    }));
}
