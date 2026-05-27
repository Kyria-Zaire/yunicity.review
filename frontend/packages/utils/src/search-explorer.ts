/** Calm local exploration helpers (WEB-SEARCH-01). */

import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";

import { HOME_EDITORIAL_TAGS } from "./home-labels";
import { formatEventDateRange } from "./event-labels";
import { neighborhoodHref } from "./neighborhood-labels";

export type LocalTrendItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function searchPlaceholderForCity(city: string): string {
  return `Rechercher à ${city.trim() || "Reims"}…`;
}

export function pickExplorerHero(
  events: LocalEvent[],
  culturalPlaces: CulturalPlaceListItem[],
): { kind: "event"; event: LocalEvent } | { kind: "cultural"; place: CulturalPlaceListItem } | null {
  const now = Date.now();
  const upcoming = events
    .filter((e) => !e.is_cancelled && new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  if (upcoming[0]) {
    return { kind: "event", event: upcoming[0] };
  }
  if (culturalPlaces[0]) {
    return { kind: "cultural", place: culturalPlaces[0] };
  }
  return null;
}

export function buildCalmLocalTrends(params: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
}): LocalTrendItem[] {
  const { city, neighborhoods, events, culturalPlaces } = params;
  const items: LocalTrendItem[] = [];
  const now = Date.now();

  for (const hood of neighborhoods.slice(0, 2)) {
    items.push({
      id: `hood-${hood.id}`,
      title: hood.display_name,
      subtitle: "Quartier · ambiance locale",
      href: neighborhoodHref(hood.slug, city),
    });
  }

  const upcoming = events
    .filter((e) => !e.is_cancelled && new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 2);

  for (const event of upcoming) {
    items.push({
      id: `event-${event.id}`,
      title: event.title,
      subtitle: formatEventDateRange(event.starts_at, event.ends_at),
      href: `/events/${event.id}`,
    });
  }

  for (const place of culturalPlaces.slice(0, 2)) {
    items.push({
      id: `culture-${place.id}`,
      title: place.name,
      subtitle: place.short_description || place.address,
      href: "/map",
    });
  }

  for (const tag of HOME_EDITORIAL_TAGS) {
    items.push({
      id: `tag-${tag.slug}`,
      title: tag.label,
      subtitle: "Thème éditorial Yunicity",
      href: `/search?q=${encodeURIComponent(tag.slug)}&city=${encodeURIComponent(city)}`,
    });
  }

  return items.slice(0, 8);
}
