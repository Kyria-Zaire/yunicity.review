import type { CulturalPlaceListItem, LocalEvent, SearchTypeFilter } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import { formatEventClockTime } from "./events-agenda";
import { buildPlacesMobileNearbyCards } from "./places-mobile-presenter";
import { resolveEventHeroImage } from "./event-hero-image";
import type { ExplorerSuggestionCard } from "./search-explorer-portal";
import {
  SEARCH_MOBILE_CATEGORY_ALL,
  SEARCH_MOBILE_CATEGORY_EVENTS,
  SEARCH_MOBILE_CATEGORY_OFFERS,
  SEARCH_MOBILE_CATEGORY_PLACES,
  SEARCH_MOBILE_CATEGORY_STORIES,
  SEARCH_MOBILE_CATEGORY_TRIBES,
  SEARCH_MOBILE_INTERESTED_SUFFIX,
} from "./search-mobile-labels";

export type SearchMobileCategoryId = Extract<
  SearchTypeFilter,
  "all" | "organization" | "event" | "post" | "tribe" | "offer"
>;

export type SearchMobileCategoryItem = {
  id: SearchMobileCategoryId;
  label: string;
};

export type SearchMobilePopularPill = {
  id: string;
  label: string;
  imageUrl: string | null;
  href: string;
};

export type SearchMobileNearbyCard = {
  id: string;
  name: string;
  tagsLine: string;
  distanceLabel: string | null;
  imageUrl: string | null;
  href: string;
};

export type SearchMobileEventRow = {
  id: string;
  title: string;
  locationName: string;
  dateLine: string;
  timeLabel: string;
  dateBadgeDay: string;
  dateBadgeMonth: string;
  interestLine: string | null;
  imageUrl: string | null;
  href: string;
};

export const SEARCH_MOBILE_CATEGORIES: SearchMobileCategoryItem[] = [
  { id: "all", label: SEARCH_MOBILE_CATEGORY_ALL },
  { id: "organization", label: SEARCH_MOBILE_CATEGORY_PLACES },
  { id: "event", label: SEARCH_MOBILE_CATEGORY_EVENTS },
  { id: "post", label: SEARCH_MOBILE_CATEGORY_STORIES },
  { id: "tribe", label: SEARCH_MOBILE_CATEGORY_TRIBES },
  { id: "offer", label: SEARCH_MOBILE_CATEGORY_OFFERS },
];

function formatEventDateBadgeParts(iso: string): Pick<
  SearchMobileEventRow,
  "dateBadgeDay" | "dateBadgeMonth"
> {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateBadgeDay: "", dateBadgeMonth: "" };
  }
  return {
    dateBadgeDay: String(date.getDate()),
    dateBadgeMonth: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

function formatEventDateLine(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayMonth = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonth.replace(".", "")}`;
}

export function formatSearchMobileLocationLine(city: string, districtLabel: string | null): string {
  const trimmedCity = city.trim() || "Reims";
  if (districtLabel?.trim()) {
    return `${trimmedCity}, ${districtLabel.trim()}`;
  }
  return trimmedCity;
}

export function buildSearchMobilePopularPills(
  suggestions: ExplorerSuggestionCard[],
  maxItems = 6,
): SearchMobilePopularPill[] {
  return suggestions.slice(0, maxItems).map((item) => ({
    id: item.id,
    label: item.title,
    imageUrl: item.imageUrl,
    href: item.href,
  }));
}

export function buildSearchMobileNearbyCards(input: {
  places: CulturalPlaceListItem[];
  city: string;
  userCoords: { lat: number; lon: number } | null;
  maxItems?: number;
}): SearchMobileNearbyCard[] {
  return buildPlacesMobileNearbyCards(input).map((card) => ({
    id: card.id,
    name: card.name,
    tagsLine: `${card.categoryLabel} · ${card.neighborhoodName}`,
    distanceLabel: card.distanceLabel,
    imageUrl: card.imageUrl,
    href: card.href,
  }));
}

export function buildSearchMobileEventRows(input: {
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): SearchMobileEventRow[] {
  const maxItems = input.maxItems ?? 6;
  const now = Date.now();

  return input.events
    .filter((event) => !event.is_cancelled && new Date(event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, maxItems)
    .map((event) => {
      const badges = formatEventDateBadgeParts(event.starts_at);
      const interestCount = event.interest_count;
      return {
        id: event.id,
        title: event.title,
        locationName: event.location_name,
        dateLine: formatEventDateLine(event.starts_at),
        timeLabel: formatEventClockTime(event.starts_at),
        ...badges,
        interestLine:
          interestCount != null && interestCount > 0
            ? `${interestCount} ${SEARCH_MOBILE_INTERESTED_SUFFIX}`
            : null,
        imageUrl: resolveEventHeroImage(event, input.culturalPlaces),
        href: `/events/${event.id}`,
      };
    });
}

export function buildSearchMobilePlaceTags(place: CulturalPlaceListItem, city: string): string {
  const category = culturalPlaceCategoryLabel(place.category);
  const district = place.neighborhood?.display_name ?? city;
  return `${category} · ${district}`;
}

export function resolveSearchMobilePopularFallbackImage(
  place: CulturalPlaceListItem | undefined,
): string | null {
  if (!place) return null;
  return resolveCulturalPlaceDisplayUrl(place, "thumbnail");
}
