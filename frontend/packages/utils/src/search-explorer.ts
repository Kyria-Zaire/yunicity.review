/** Calm local exploration helpers (WEB-SEARCH-01 / WEB-SEARCH-02C). */

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";

import { HOME_EDITORIAL_TAGS } from "./home-labels";
import { formatEventDateRange } from "./event-labels";
import { neighborhoodHref } from "./neighborhood-labels";
import { resolveCulturalPlaceThumbnailUrl } from "./cultural-place-media";
import { tribeHref } from "./tribe-labels";

export type LocalTrendType =
  | "event"
  | "cultural_place"
  | "neighborhood"
  | "passport_offer"
  | "tribe"
  | "editorial_tag";

export type LocalTrendIcon =
  | "calendar"
  | "landmark"
  | "map-pin"
  | "passport"
  | "users"
  | "hash";

export type LocalTrendItem = {
  id: string;
  type: LocalTrendType;
  title: string;
  subtitle: string;
  meta: string;
  imageUrl?: string | null;
  icon: LocalTrendIcon;
  href: string;
  actionLabel: string;
};

export type LocalTrendContext = {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  passportOffers: PartnerOffer[];
};

export const LOCAL_TREND_MAX_ITEMS = 5;

const TREND_META: Record<LocalTrendType, string> = {
  event: "Moment à ne pas manquer",
  cultural_place: "Lieu à découvrir",
  neighborhood: "Quartier qui bouge",
  passport_offer: "Privilège local",
  tribe: "Discussion locale",
  editorial_tag: "Thème local",
};

const TREND_ICON: Record<LocalTrendType, LocalTrendIcon> = {
  event: "calendar",
  cultural_place: "landmark",
  neighborhood: "map-pin",
  passport_offer: "passport",
  tribe: "users",
  editorial_tag: "hash",
};

const TREND_ACTION: Record<LocalTrendType, string> = {
  event: "Voir",
  cultural_place: "Explorer",
  neighborhood: "Découvrir",
  passport_offer: "Profiter",
  tribe: "Rejoindre",
  editorial_tag: "Explorer",
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

function upcomingEvents(events: LocalEvent[]): LocalEvent[] {
  const now = Date.now();
  return events
    .filter((e) => !e.is_cancelled && new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

function trendFromEvent(event: LocalEvent): LocalTrendItem {
  const location = event.location_name ?? event.city;
  return {
    id: `event-${event.id}`,
    type: "event",
    title: event.title,
    subtitle: formatEventDateRange(event.starts_at, event.ends_at),
    meta: TREND_META.event,
    imageUrl: event.cover_image_url,
    icon: TREND_ICON.event,
    href: `/events/${event.id}`,
    actionLabel: TREND_ACTION.event,
  };
}

function trendFromPlace(place: CulturalPlaceListItem): LocalTrendItem {
  return {
    id: `culture-${place.id}`,
    type: "cultural_place",
    title: place.name,
    subtitle: place.short_description || place.address,
    meta: TREND_META.cultural_place,
    imageUrl: resolveCulturalPlaceThumbnailUrl(place),
    icon: TREND_ICON.cultural_place,
    href: "/map",
    actionLabel: TREND_ACTION.cultural_place,
  };
}

function trendFromNeighborhood(hood: Neighborhood, city: string): LocalTrendItem {
  return {
    id: `hood-${hood.id}`,
    type: "neighborhood",
    title: hood.display_name,
    subtitle: hood.short_description ?? "Ambiance locale",
    meta: TREND_META.neighborhood,
    imageUrl: hood.cover_image_url,
    icon: TREND_ICON.neighborhood,
    href: neighborhoodHref(hood.slug, city),
    actionLabel: TREND_ACTION.neighborhood,
  };
}

function trendFromOffer(offer: PartnerOffer): LocalTrendItem {
  return {
    id: `offer-${offer.id}`,
    type: "passport_offer",
    title: offer.title,
    subtitle: offer.organization.name,
    meta: TREND_META.passport_offer,
    imageUrl: offer.organization.logo_url,
    icon: TREND_ICON.passport_offer,
    href: "/passport",
    actionLabel: TREND_ACTION.passport_offer,
  };
}

function trendFromTribe(tribe: Tribe, city: string): LocalTrendItem {
  const subtitle = tribe.description
    ? tribe.description.length > 80
      ? `${tribe.description.slice(0, 77)}…`
      : tribe.description
    : "Communauté locale";
  return {
    id: `tribe-${tribe.id}`,
    type: "tribe",
    title: tribe.name,
    subtitle,
    meta: TREND_META.tribe,
    imageUrl: null,
    icon: TREND_ICON.tribe,
    href: tribeHref(tribe.slug, city),
    actionLabel: TREND_ACTION.tribe,
  };
}

function trendFromTag(tag: (typeof HOME_EDITORIAL_TAGS)[number], city: string): LocalTrendItem {
  return {
    id: `tag-${tag.slug}`,
    type: "editorial_tag",
    title: tag.label,
    subtitle: "Explorer ce thème à " + (city.trim() || "Reims"),
    meta: TREND_META.editorial_tag,
    imageUrl: null,
    icon: TREND_ICON.editorial_tag,
    href: `/search?q=${encodeURIComponent(tag.slug)}&city=${encodeURIComponent(city)}`,
    actionLabel: TREND_ACTION.editorial_tag,
  };
}

/**
 * Builds up to 5 editorial local trend items from real context data.
 * Order: event → cultural place → neighborhood → passport → tribe/editorial.
 */
export function buildLocalTrendItems(context: LocalTrendContext): LocalTrendItem[] {
  const { city, neighborhoods, events, culturalPlaces, tribes, passportOffers } = context;
  const items: LocalTrendItem[] = [];

  const nextEvent = upcomingEvents(events)[0];
  if (nextEvent) items.push(trendFromEvent(nextEvent));

  const nextPlace = culturalPlaces[0];
  if (nextPlace) items.push(trendFromPlace(nextPlace));

  const nextHood = neighborhoods[0];
  if (nextHood) items.push(trendFromNeighborhood(nextHood, city));

  const nextOffer = passportOffers[0];
  if (nextOffer) items.push(trendFromOffer(nextOffer));

  const nextTribe = tribes[0];
  if (nextTribe) {
    items.push(trendFromTribe(nextTribe, city));
  } else if (items.length > 0) {
    const tag = HOME_EDITORIAL_TAGS[0];
    if (tag) items.push(trendFromTag(tag, city));
  }

  return items.slice(0, LOCAL_TREND_MAX_ITEMS);
}

/** @deprecated Use buildLocalTrendItems — kept for backward compatibility. */
export function buildCalmLocalTrends(params: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
}): Array<{ id: string; title: string; subtitle: string; href: string }> {
  return buildLocalTrendItems({ ...params, tribes: [], passportOffers: [] }).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    href: item.href,
  }));
}

export function filterUpcomingEvents(events: LocalEvent[]): LocalEvent[] {
  return upcomingEvents(events);
}

export function filterLocalNeighborhoods(
  neighborhoods: Neighborhood[],
  query: string,
): Neighborhood[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return neighborhoods;
  return neighborhoods.filter(
    (n) =>
      n.display_name.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q) ||
      (n.short_description?.toLowerCase().includes(q) ?? false),
  );
}

export function filterLocalTribes(tribes: Tribe[], query: string): Tribe[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return tribes;
  return tribes.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false),
  );
}

export function filterLocalOffers(offers: PartnerOffer[], query: string): PartnerOffer[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return offers;
  return offers.filter(
    (o) =>
      o.title.toLowerCase().includes(q) ||
      o.organization.name.toLowerCase().includes(q) ||
      (o.description?.toLowerCase().includes(q) ?? false),
  );
}
