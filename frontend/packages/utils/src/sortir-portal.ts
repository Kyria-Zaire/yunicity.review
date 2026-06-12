import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  Tribe,
} from "@yunicity/types";

import { INTEREST_LABELS } from "./domain-labels";
import { eventTypeLabel } from "./event-labels";
import { resolveFeaturedCarouselEventImage, resolveEventHeroImage } from "./event-hero-image";
import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import { resolveCulturalPlaceImageOverride } from "./event-hero-image";
import {
  eventCalendarDayKey,
  formatEventClockTime,
  formatEventDurationLabel,
} from "./events-agenda";
import { buildMapPlaceUrl } from "./explorer-links";
import {
  buildNeighborhoodFeaturedCards,
  type NeighborhoodFeaturedCard,
} from "./neighborhood-portal";
import { eventBelongsToNeighborhood } from "./neighborhood-atmosphere";
import { neighborhoodAmbianceLabel } from "./neighborhood-labels";
import {
  SORTIR_CATEGORY_CAFE,
  SORTIR_CATEGORY_CONCERTS,
  SORTIR_CATEGORY_CULTURE,
  SORTIR_CATEGORY_RENCONTRES,
  SORTIR_CATEGORY_SORTIR,
  SORTIR_CATEGORY_TONIGHT,
  SORTIR_CATEGORY_TREND,
  SORTIR_MOOD_CALM,
  SORTIR_MOOD_CULTURE,
  SORTIR_MOOD_LIVELY,
  SORTIR_MOOD_LIVE_MUSIC,
  SORTIR_MOOD_OUTINGS,
  SORTIR_HERO_STAT_EVENTS,
  SORTIR_HERO_STAT_NEIGHBORHOODS,
  SORTIR_HERO_STAT_PLACES,
  SORTIR_HERO_STAT_TRIBES,
  SORTIR_FEATURED_LINK_MAP,
  SORTIR_FEATURED_LINK_NEIGHBORHOODS,
  SORTIR_FEATURED_LINK_PLACES,
  SORTIR_FEATURED_LINK_TRIBES,
} from "./sortir-portal-labels";
import { findTribeForEvent } from "./tribe-portal";

export type SortirCategoryId =
  | ""
  | "culture"
  | "sortir"
  | "cafe"
  | "concerts"
  | "rencontres"
  | "tonight"
  | "trend";

export type SortirCategory = {
  id: SortirCategoryId;
  label: string;
};

export type SortirLiveEventCard = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: "concert" | "tasting" | "exhibition" | "default";
  timeLabel: string;
  metaLine: string;
  locationLine: string;
  imageUrl: string | null;
  href: string;
  interestedByMe: boolean;
};

export type SortirLivePlaceCard = {
  id: string;
  name: string;
  subtitle: string;
  moodLabel: string;
  moodTone: "lively" | "calm" | "music" | "culture";
  imageUrl: string | null;
  href: string;
  tonightEventCount: number;
};

export type SortirActiveNeighborhoodCard = NeighborhoodFeaturedCard & {
  moodLabel: string;
  moodTone: "lively" | "calm" | "culture" | "outings";
  eventsLabel: string;
};

export type SortirForYouCard = {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  locationLine: string;
  spotsLine: string | null;
  imageUrl: string | null;
  href: string;
  interestTags: string[];
};

export type SortirTribeTonightItem = {
  id: string;
  tribeName: string;
  eventTitle: string;
  timeLabel: string;
  href: string;
};

export type SortirHeroStatId = "neighborhoods" | "places" | "tribes" | "events";

export type SortirHeroStat = {
  id: SortirHeroStatId;
  label: string;
  count: number;
};

export type SortirFeaturedTodayResult =
  | { kind: "events"; items: SortirLiveEventCard[] }
  | { kind: "fallback"; links: SortirFeaturedFallbackLink[] };

export type SortirFeaturedFallbackLink = {
  id: "neighborhoods" | "places" | "tribes" | "map";
  label: string;
  href: string;
};

export type SortirNewUserContextInput = {
  savedEventCount: number;
  joinedTribeCount: number;
  interestCount: number;
  passportStampsCount: number;
  feedPostCount?: number;
};

export const SORTIR_CATEGORIES: SortirCategory[] = [
  { id: "culture", label: SORTIR_CATEGORY_CULTURE },
  { id: "sortir", label: SORTIR_CATEGORY_SORTIR },
  { id: "cafe", label: SORTIR_CATEGORY_CAFE },
  { id: "concerts", label: SORTIR_CATEGORY_CONCERTS },
  { id: "rencontres", label: SORTIR_CATEGORY_RENCONTRES },
  { id: "tonight", label: SORTIR_CATEGORY_TONIGHT },
  { id: "trend", label: SORTIR_CATEGORY_TREND },
];

const CATEGORY_EVENT_TYPES: Record<Exclude<SortirCategoryId, "" | "tonight" | "trend">, string[]> = {
  culture: ["exhibition", "workshop", "partner_event"],
  sortir: ["association_evening", "partner_event", "local_market", "market"],
  cafe: ["cafe_meetup"],
  concerts: ["local_concert"],
  rencontres: ["meetup", "creator_meetup", "cafe_meetup", "student_event"],
};

const INTEREST_EVENT_TYPES: Record<string, string[]> = {
  culture: ["exhibition", "workshop", "partner_event"],
  art: ["exhibition", "workshop"],
  music: ["local_concert"],
  food: ["cafe_meetup", "local_market", "market"],
  nightlife: ["association_evening", "local_concert", "partner_event"],
  sports: ["meetup", "student_event"],
  fitness: ["meetup", "student_event"],
  business: ["creator_meetup", "partner_event"],
  entrepreneurship: ["creator_meetup", "partner_event"],
  tech: ["creator_meetup", "workshop"],
  gaming: ["meetup", "student_event"],
};

const CAFE_CATEGORY_PATTERN = /cafe|café|gastronomie|restaurant|brasserie|boulangerie|bar\b/i;

function isCafePlace(place: CulturalPlaceListItem): boolean {
  return CAFE_CATEGORY_PATTERN.test(place.category ?? "");
}
const EVENING_HOUR = 18;
const TREND_HOURS = 48;

export function isEventTonight(event: LocalEvent, now = new Date()): boolean {
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return false;
  return (
    eventCalendarDayKey(event.starts_at) === eventCalendarDayKey(now.toISOString()) &&
    start.getHours() >= EVENING_HOUR
  );
}

function isEventStartingSoon(event: LocalEvent, now = new Date()): boolean {
  const start = Date.parse(event.starts_at);
  if (!Number.isFinite(start)) return false;
  const horizon = now.getTime() + TREND_HOURS * 60 * 60 * 1000;
  return start >= now.getTime() && start <= horizon;
}

function eventBadgeTone(eventType: string | null): SortirLiveEventCard["badgeTone"] {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") return "concert";
  if (type === "exhibition") return "exhibition";
  if (type === "cafe_meetup" || type === "local_market" || type === "market") return "tasting";
  return "default";
}

function eventMetaLine(event: LocalEvent, now = new Date()): string {
  if (event.interested_by_me) {
    return "Vous êtes intéressé·e";
  }
  const interestCount = event.interest_count ?? 0;
  if (interestCount > 0) {
    return `${interestCount} intéressé${interestCount > 1 ? "s" : ""}`;
  }
  const duration = formatEventDurationLabel(event.starts_at, event.ends_at);
  if (duration && event.ends_at) {
    const end = new Date(event.ends_at);
    if (!Number.isNaN(end.getTime()) && end.getTime() > now.getTime()) {
      return `Jusqu'au ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
    }
  }
  return "";
}

export function filterEventsBySortirCategory(
  events: LocalEvent[],
  categoryId: SortirCategoryId,
  now = new Date(),
): LocalEvent[] {
  if (!categoryId) return events;
  if (categoryId === "tonight") {
    return events.filter((event) => isEventTonight(event, now));
  }
  if (categoryId === "trend") {
    return events
      .filter((event) => isEventStartingSoon(event, now))
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  }
  const allowed = CATEGORY_EVENT_TYPES[categoryId];
  return events.filter((event) => allowed.includes(event.event_type?.trim().toLowerCase() ?? ""));
}

export function buildSortirLiveEventCards(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  categoryId?: SortirCategoryId;
  maxItems?: number;
  now?: Date;
}): SortirLiveEventCard[] {
  const now = input.now ?? new Date();
  const maxItems = input.maxItems ?? 8;
  const base = filterEventsBySortirCategory(input.events, input.categoryId ?? "", now);

  return base
    .slice()
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .slice(0, maxItems)
    .map((event) => {
      const subtitle =
        event.organization?.name?.trim() ||
        event.location_name?.trim() ||
        event.district?.trim() ||
        input.city;
      const locationLine =
        event.neighborhood_summary?.display_name ?? event.district?.trim() ?? event.city;
      return {
        id: event.id,
        title: event.title,
        subtitle,
        badge: (eventTypeLabel(event.event_type) ?? "Sortie").toUpperCase(),
        badgeTone: eventBadgeTone(event.event_type),
        timeLabel: formatEventClockTime(event.starts_at),
        metaLine: eventMetaLine(event, now),
        locationLine,
        imageUrl:
          resolveFeaturedCarouselEventImage(event) ??
          resolveEventHeroImage(event, input.culturalPlaces),
        href: `/events/${event.id}`,
        interestedByMe: event.interested_by_me,
      };
    });
}

function resolvePlaceMood(
  place: CulturalPlaceListItem,
  tonightEvents: LocalEvent[],
): { label: string; tone: SortirLivePlaceCard["moodTone"] } {
  const hasConcert = tonightEvents.some((event) => event.event_type === "local_concert");
  const hasEvening = tonightEvents.some((event) => isEventTonight(event));
  const isCafe = isCafePlace(place);

  if (hasConcert) {
    return { label: SORTIR_MOOD_LIVE_MUSIC, tone: "music" };
  }
  if (hasEvening && tonightEvents.length >= 2) {
    return { label: SORTIR_MOOD_LIVELY, tone: "lively" };
  }
  if (isCafe) {
    return { label: SORTIR_MOOD_CALM, tone: "calm" };
  }
  if (tonightEvents.some((event) => event.event_type === "exhibition")) {
    return { label: SORTIR_MOOD_CULTURE, tone: "culture" };
  }
  return { label: SORTIR_MOOD_OUTINGS, tone: "lively" };
}

export function buildSortirLivePlaceCards(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): SortirLivePlaceCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 6;
  const now = input.now ?? new Date();
  const tonightEvents = input.events.filter((event) => isEventTonight(event, now));

  return input.culturalPlaces
    .map((place) => {
      const relatedTonight = tonightEvents.filter((event) => {
        const hoodSlug = place.neighborhood?.slug;
        if (hoodSlug && event.neighborhood_summary?.slug === hoodSlug) return true;
        if (hoodSlug) {
          const hood = { slug: hoodSlug, display_name: place.neighborhood?.display_name ?? "" };
          return eventBelongsToNeighborhood(event, hood as Neighborhood);
        }
        return event.location_name.toLowerCase().includes(place.name.toLowerCase().slice(0, 6));
      });

      if (relatedTonight.length === 0) {
        return null;
      }

      const mood = resolvePlaceMood(place, relatedTonight);
      return {
        id: place.id,
        name: place.name,
        subtitle: place.editorial_excerpt?.trim() || place.short_description?.trim() || place.category,
        moodLabel: mood.label,
        moodTone: mood.tone,
        imageUrl: resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place),
        href: buildMapPlaceUrl(place.slug, { city }),
        tonightEventCount: relatedTonight.length,
      };
    })
    .filter((item): item is SortirLivePlaceCard => Boolean(item))
    .sort((a, b) => b.tonightEventCount - a.tonightEventCount || a.name.localeCompare(b.name, "fr"))
    .slice(0, maxItems);
}

function resolveNeighborhoodMood(
  hood: Neighborhood,
  events: LocalEvent[],
): { label: string; tone: SortirActiveNeighborhoodCard["moodTone"] } {
  const hoodEvents = events.filter((event) => eventBelongsToNeighborhood(event, hood));
  const hasEvening = hoodEvents.some((event) => isEventTonight(event));
  const hasCulture = hoodEvents.some((event) =>
    ["exhibition", "workshop", "partner_event"].includes(event.event_type ?? ""),
  );
  const ambiance = neighborhoodAmbianceLabel(hood.ambiance);

  if (hasEvening && hoodEvents.length >= 2) {
    return { label: SORTIR_MOOD_LIVELY, tone: "lively" };
  }
  if (hasCulture) {
    return { label: SORTIR_MOOD_CULTURE, tone: "culture" };
  }
  if (ambiance?.toLowerCase().includes("calme")) {
    return { label: SORTIR_MOOD_CALM, tone: "calm" };
  }
  if (hoodEvents.length > 0) {
    return { label: SORTIR_MOOD_OUTINGS, tone: "outings" };
  }
  return { label: SORTIR_MOOD_CALM, tone: "calm" };
}

export function buildSortirActiveNeighborhoodCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): SortirActiveNeighborhoodCard[] {
  const upcoming = input.events.filter((event) => !event.is_cancelled);
  const cards = buildNeighborhoodFeaturedCards({
    city: input.city,
    neighborhoods: input.neighborhoods,
    events: upcoming,
    culturalPlaces: input.culturalPlaces,
    maxItems: input.maxItems ?? 4,
    now: input.now,
  });

  return cards.map((card) => {
    const hood = input.neighborhoods.find((item) => item.slug === card.slug);
    const mood = hood
      ? resolveNeighborhoodMood(hood, upcoming)
      : { label: SORTIR_MOOD_CALM, tone: "calm" as const };
    const count = card.momentsCount;
    return {
      ...card,
      moodLabel: mood.label,
      moodTone: mood.tone,
      eventsLabel:
        count === 0
          ? "Aucun événement"
          : count === 1
            ? "1 événement"
            : `${count} événements`,
    };
  });
}

function scoreEventForInterests(event: LocalEvent, interests: string[]): number {
  const type = event.event_type?.trim().toLowerCase() ?? "";
  let score = 0;
  for (const interest of interests) {
    const types = INTEREST_EVENT_TYPES[interest] ?? [];
    if (types.includes(type)) score += 3;
    const label = INTEREST_LABELS[interest]?.toLowerCase();
    if (label && event.title.toLowerCase().includes(label.slice(0, 4))) score += 1;
  }
  return score;
}

export function buildSortirForYouCard(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  interests: string[];
  now?: Date;
}): SortirForYouCard | null {
  const interests = input.interests.filter(Boolean);
  if (interests.length === 0) return null;

  const now = input.now ?? new Date();
  const ranked = input.events
    .filter((event) => Date.parse(event.starts_at) >= now.getTime())
    .map((event) => ({ event, score: scoreEventForInterests(event, interests) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(a.event.starts_at) - Date.parse(b.event.starts_at));

  const match = ranked[0]?.event;
  if (!match) return null;

  const startMs = Date.parse(match.starts_at);
  const hoursUntil = Math.max(0, Math.round((startMs - now.getTime()) / 3_600_000));
  const timeLabel =
    hoursUntil <= 24 && hoursUntil >= 0
      ? `Dans ${hoursUntil}h • ${formatEventClockTime(match.starts_at)}`
      : formatEventClockTime(match.starts_at);

  return {
    id: match.id,
    title: match.title,
    subtitle: match.description?.trim() || eventTypeLabel(match.event_type) || "Sortie locale",
    timeLabel,
    locationLine:
      match.neighborhood_summary?.display_name ?? match.district?.trim() ?? match.location_name,
    spotsLine:
      (match.interest_count ?? 0) > 0
        ? `${match.interest_count} intéressé${(match.interest_count ?? 0) > 1 ? "s" : ""}`
        : null,
    imageUrl:
      resolveFeaturedCarouselEventImage(match) ??
      resolveEventHeroImage(match, input.culturalPlaces),
    href: `/events/${match.id}`,
    interestTags: interests
      .slice(0, 4)
      .map((interest) => INTEREST_LABELS[interest] ?? interest)
      .filter(Boolean),
  };
}

export function buildSortirTribeTonightItems(input: {
  city: string;
  events: LocalEvent[];
  tribes: Tribe[];
  maxItems?: number;
  now?: Date;
}): SortirTribeTonightItem[] {
  const now = input.now ?? new Date();
  const memberTribes = input.tribes.filter((tribe) => !tribe.is_archived && tribe.viewer_is_member);

  return input.events
    .filter((event) => !event.is_cancelled && isEventTonight(event, now))
    .map((event) => {
      const tribe = findTribeForEvent(event, memberTribes);
      if (!tribe) return null;
      return {
        id: event.id,
        tribeName: tribe.name,
        eventTitle: event.title,
        timeLabel: formatEventClockTime(event.starts_at),
        href: `/events/${event.id}`,
      };
    })
    .filter((item): item is SortirTribeTonightItem => Boolean(item))
    .slice(0, input.maxItems ?? 4);
}

export function resolveSortirPortalHeroImage(input: {
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  now?: Date;
}): string | null {
  const now = input.now ?? new Date();
  const tonight = input.events.find((event) => isEventTonight(event, now));
  if (tonight) {
    return (
      resolveFeaturedCarouselEventImage(tonight) ??
      resolveEventHeroImage(tonight, input.culturalPlaces)
    );
  }
  const next = input.events[0];
  if (next) {
    return (
      resolveFeaturedCarouselEventImage(next) ??
      resolveEventHeroImage(next, input.culturalPlaces)
    );
  }
  const featuredPlace = input.culturalPlaces.find((place) => place.is_featured);
  if (featuredPlace) {
    return resolveCulturalPlaceImageOverride(featuredPlace) ?? resolveCulturalPlaceHeroUrl(featuredPlace);
  }
  return null;
}

export function sortirNeighborhoodsHref(city: string): string {
  return `/neighborhoods?city=${encodeURIComponent(city.trim() || "Reims")}`;
}

export function buildSortirHeroStats(input: {
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  events: LocalEvent[];
}): SortirHeroStat[] {
  const neighborhoodCount = input.neighborhoods.length;
  const placeCount = input.culturalPlaces.length;
  const tribeCount = input.tribes.filter((tribe) => !tribe.is_archived).length;
  const eventCount = input.events.length;

  return [
    {
      id: "neighborhoods",
      label: SORTIR_HERO_STAT_NEIGHBORHOODS(neighborhoodCount),
      count: neighborhoodCount,
    },
    {
      id: "places",
      label: SORTIR_HERO_STAT_PLACES(placeCount),
      count: placeCount,
    },
    {
      id: "tribes",
      label: SORTIR_HERO_STAT_TRIBES(tribeCount),
      count: tribeCount,
    },
    {
      id: "events",
      label: SORTIR_HERO_STAT_EVENTS(eventCount),
      count: eventCount,
    },
  ];
}

export function buildSortirFeaturedToday(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): SortirFeaturedTodayResult {
  const cards = buildSortirLiveEventCards({
    city: input.city,
    events: input.events,
    culturalPlaces: input.culturalPlaces,
    maxItems: input.maxItems ?? 3,
    now: input.now,
  });

  if (cards.length > 0) {
    return { kind: "events", items: cards };
  }

  const city = input.city.trim() || "Reims";
  return {
    kind: "fallback",
    links: [
      {
        id: "neighborhoods",
        label: SORTIR_FEATURED_LINK_NEIGHBORHOODS,
        href: sortirNeighborhoodsHref(city),
      },
      { id: "places", label: SORTIR_FEATURED_LINK_PLACES, href: "/places" },
      { id: "tribes", label: SORTIR_FEATURED_LINK_TRIBES, href: "/tribes" },
      { id: "map", label: SORTIR_FEATURED_LINK_MAP, href: `/map?city=${encodeURIComponent(city)}` },
    ],
  };
}

export function isNewLocalUserContext(input: SortirNewUserContextInput): boolean {
  const noFeedPosts = input.feedPostCount === undefined || input.feedPostCount === 0;
  return (
    input.savedEventCount === 0 &&
    input.joinedTribeCount === 0 &&
    input.interestCount === 0 &&
    input.passportStampsCount === 0 &&
    noFeedPosts
  );
}
