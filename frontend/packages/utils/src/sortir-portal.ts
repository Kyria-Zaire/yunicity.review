import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  Tribe,
} from "@yunicity/types";

import { INTEREST_LABELS } from "./domain-labels";
import { eventTypeLabel, formatEventLocation } from "./event-labels";
import { resolveFeaturedCarouselEventImage, resolveEventHeroImage } from "./event-hero-image";
import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import { resolveCulturalPlaceImageOverride } from "./event-hero-image";
import {
  eventCalendarDayKey,
  filterAgendaUpcomingEvents,
  formatEventClockTime,
  formatEventDurationLabel,
} from "./events-agenda";
import { buildMapPlaceUrl } from "./explorer-links";
import { haversineMeters } from "./map-portal";
import {
  buildNeighborhoodFeaturedCards,
  type NeighborhoodFeaturedCard,
} from "./neighborhood-portal";
import { eventBelongsToNeighborhood } from "./neighborhood-atmosphere";
import { neighborhoodAmbianceLabel, formatTerritorialLine } from "./neighborhood-labels";
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
  SORTIR_CARD_BADGE_CULTURE,
  SORTIR_CARD_BADGE_FOOD,
  SORTIR_CARD_BADGE_LOCAL,
  SORTIR_CARD_BADGE_MUSIC,
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
  badgeTone: "concert" | "tasting" | "exhibition" | "local" | "default";
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
const DEFAULT_EVENT_TIMEZONE = "Europe/Paris";

function localHourInTimezone(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = parts.find((part) => part.type === "hour")?.value;
  return hour ? Number(hour) : Number.NaN;
}

export function isEventTonight(event: LocalEvent, now = new Date()): boolean {
  const timeZone = event.timezone?.trim() || DEFAULT_EVENT_TIMEZONE;
  if (Number.isNaN(new Date(event.starts_at).getTime())) return false;
  const startHour = localHourInTimezone(event.starts_at, timeZone);
  if (Number.isNaN(startHour)) return false;
  return (
    eventCalendarDayKey(event.starts_at) === eventCalendarDayKey(now.toISOString()) &&
    startHour >= EVENING_HOUR
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
  if (type === "local_market" || type === "market") return "tasting";
  if (type === "cafe_meetup" || type === "meetup" || type === "association_evening") return "local";
  return "default";
}

function sortirCardBadgeLabel(eventType: string | null): string {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") return SORTIR_CARD_BADGE_MUSIC;
  if (type === "local_market" || type === "market") return SORTIR_CARD_BADGE_FOOD;
  if (type === "cafe_meetup" || type === "meetup" || type === "association_evening") {
    return SORTIR_CARD_BADGE_LOCAL;
  }
  if (type === "exhibition") return SORTIR_CARD_BADGE_CULTURE;
  return eventTypeLabel(eventType) ?? "Sortie";
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
        badge: sortirCardBadgeLabel(event.event_type).toUpperCase(),
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
  const now = input.now ?? new Date();
  const maxItems = input.maxItems ?? 3;
  const ranked = input.events
    .slice()
    .filter((event) => !event.is_cancelled)
    .sort((a, b) => {
      const score = (event: LocalEvent): number => {
        let value = 0;
        if (event.cover_image_url?.trim()) value += 4;
        if ((event.description?.trim().length ?? 0) >= 40) value += 2;
        if (isEventTonight(event, now)) value += 1;
        // « À la une » : privilégier le patrimoine / expo pour laisser
        // musique / food / vie locale dans la grille « Ce soir ».
        const type = event.event_type?.trim().toLowerCase();
        if (type === "exhibition") value += 3;
        return value;
      };
      const delta = score(b) - score(a);
      if (delta !== 0) return delta;
      return Date.parse(a.starts_at) - Date.parse(b.starts_at);
    })
    .slice(0, maxItems);

  const cards = ranked.map((event) => {
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
      badge: sortirCardBadgeLabel(event.event_type).toUpperCase(),
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

/** Filtres temporels desktop (rail gauche). */
export type SortirDesktopWhenId = "today" | "tomorrow" | "weekend" | "pick_date";

export type SortirDesktopCategoryId =
  | ""
  | "culture"
  | "music"
  | "food"
  | "sport"
  | "family"
  | "local";

export type SortirDesktopToggles = {
  free: boolean;
  nearby: boolean;
  accessible: boolean;
  indoor: boolean;
};

export type SortirDesktopGeoOrigin = {
  latitude: number;
  longitude: number;
};

export type SortirDesktopAgendaRow = {
  id: string;
  weekdayLabel: string;
  dayLabel: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  placeLabel: string;
  href: string;
};

export type SortirDesktopSoonCard = {
  id: string;
  title: string;
  timeLabel: string;
  placeLabel: string;
  relativeLabel: string;
  imageUrl: string | null;
  href: string;
};

export type SortirDesktopWeekendCard = {
  id: string;
  title: string;
  dayLabel: string;
  imageUrl: string | null;
  href: string;
};

const MONTH_SHORT = [
  "JAN",
  "FÉV",
  "MAR",
  "AVR",
  "MAI",
  "JUN",
  "JUL",
  "AOÛ",
  "SEP",
  "OCT",
  "NOV",
  "DÉC",
] as const;

const WEEKDAY_SHORT_FR = ["DIM.", "LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM."] as const;

export function mapSortirDesktopCategoryToPortal(
  categoryId: SortirDesktopCategoryId,
): SortirCategoryId {
  switch (categoryId) {
    case "culture":
      return "culture";
    case "music":
      return "concerts";
    case "food":
      return "cafe";
    case "sport":
      return "sortir";
    case "family":
      return "rencontres";
    case "local":
      return "sortir";
    default:
      return "";
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isWeekendDay(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function filterSortirEventsByWhen(
  events: LocalEvent[],
  whenId: SortirDesktopWhenId,
  now = new Date(),
): LocalEvent[] {
  if (whenId === "pick_date") return events;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return events.filter((event) => {
    const startsAt = Date.parse(event.starts_at);
    if (!Number.isFinite(startsAt)) return false;
    const eventDate = new Date(startsAt);

    switch (whenId) {
      case "today":
        return startsAt >= todayStart.getTime() && startsAt <= todayEnd.getTime();
      case "tomorrow": {
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowEnd = endOfDay(tomorrow);
        return startsAt >= tomorrow.getTime() && startsAt <= tomorrowEnd.getTime();
      }
      case "weekend": {
        const cursor = new Date(todayStart);
        for (let i = 0; i < 7; i += 1) {
          if (isWeekendDay(cursor)) {
            const dayStart = startOfDay(cursor);
            const dayEnd = endOfDay(cursor);
            if (startsAt >= dayStart.getTime() && startsAt <= dayEnd.getTime()) return true;
          }
          cursor.setDate(cursor.getDate() + 1);
        }
        return false;
      }
      default:
        return true;
    }
  });
}

const SORTIR_NEARBY_MAX_METERS = 3000;
const FREE_SIGNAL = /gratuit|entr[ée]e libre|sans frais|free entry/i;
const ACCESSIBLE_SIGNAL = /accessible|pmr|fauteuil|handicap/i;
const OUTDOOR_SIGNAL = /plein air|ext[ée]rieur|parc\b|jardin|parvis|march[ée]|place publique/i;
const INDOOR_SIGNAL = /salle|mus[ée]e|th[ée][aâ]tre|int[ée]rieur|galerie|cryptoportique|cin[ée]ma/i;
const INDOOR_EVENT_TYPES = new Set([
  "exhibition",
  "local_concert",
  "cafe_meetup",
  "workshop",
  "creator_meetup",
]);

function eventTextBlob(event: LocalEvent): string {
  return `${event.title} ${event.description ?? ""} ${event.location_name} ${event.address ?? ""}`;
}

export function isSortirEventMarkedFree(event: LocalEvent): boolean {
  return FREE_SIGNAL.test(eventTextBlob(event));
}

export function isSortirEventMarkedAccessible(event: LocalEvent): boolean {
  return ACCESSIBLE_SIGNAL.test(eventTextBlob(event));
}

export function isSortirEventMarkedIndoor(event: LocalEvent): boolean {
  const blob = eventTextBlob(event);
  if (OUTDOOR_SIGNAL.test(blob)) return false;
  if (INDOOR_SIGNAL.test(blob)) return true;
  const type = event.event_type?.trim().toLowerCase() ?? "";
  return INDOOR_EVENT_TYPES.has(type);
}

export function isSortirEventWithinNearby(
  event: LocalEvent,
  origin: SortirDesktopGeoOrigin,
  maxMeters = SORTIR_NEARBY_MAX_METERS,
): boolean {
  if (event.latitude == null || event.longitude == null) return false;
  return (
    haversineMeters(origin.latitude, origin.longitude, event.latitude, event.longitude) <= maxMeters
  );
}

/**
 * Applique les toggles desktop Sortir.
 * Heuristiques texte pour Gratuit / Accessible / Intérieur (pas de champs API dédiés).
 * Nearby utilise la géoloc event + origin utilisateur/ville.
 */
export function filterSortirEventsByDesktopToggles(
  events: LocalEvent[],
  toggles: SortirDesktopToggles,
  origin?: SortirDesktopGeoOrigin | null,
): LocalEvent[] {
  if (!toggles.free && !toggles.nearby && !toggles.accessible && !toggles.indoor) {
    return events;
  }

  return events.filter((event) => {
    if (toggles.free && !isSortirEventMarkedFree(event)) return false;
    if (toggles.accessible && !isSortirEventMarkedAccessible(event)) return false;
    if (toggles.indoor && !isSortirEventMarkedIndoor(event)) return false;
    if (toggles.nearby) {
      if (!origin) return false;
      if (!isSortirEventWithinNearby(event, origin)) return false;
    }
    return true;
  });
}

function formatAgendaPlace(event: LocalEvent, city: string): string {
  return (
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    formatEventLocation(event, city)
  );
}

export function buildSortirDesktopAgendaRows(
  savedEvents: LocalEvent[],
  city: string,
  maxItems = 2,
  now = new Date(),
): SortirDesktopAgendaRow[] {
  const upcoming = filterAgendaUpcomingEvents(savedEvents, now);
  return upcoming.slice(0, maxItems).map((event) => {
    const date = new Date(event.starts_at);
    return {
      id: event.id,
      weekdayLabel: WEEKDAY_SHORT_FR[date.getDay()] ?? "—",
      dayLabel: String(date.getDate()),
      monthLabel: MONTH_SHORT[date.getMonth()] ?? "—",
      title: event.title,
      timeLabel: formatEventClockTime(event.starts_at),
      placeLabel: formatAgendaPlace(event, city),
      href: `/events/${event.id}`,
    };
  });
}

export function buildSortirDesktopSoonCard(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  now?: Date;
}): SortirDesktopSoonCard | null {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const upcoming = filterAgendaUpcomingEvents(input.events, now)
    .map((event) => ({ event, startsAt: Date.parse(event.starts_at) }))
    .filter(({ startsAt }) => Number.isFinite(startsAt) && startsAt >= nowMs)
    .sort((a, b) => a.startsAt - b.startsAt);

  const next = upcoming[0];
  if (!next) return null;

  const diffHours = Math.max(1, Math.round((next.startsAt - nowMs) / (1000 * 60 * 60)));
  const cards = buildSortirLiveEventCards({
    city: input.city,
    events: [next.event],
    culturalPlaces: input.culturalPlaces,
    maxItems: 1,
    now,
  });
  const card = cards[0];
  if (!card) return null;

  return {
    id: card.id,
    title: card.title,
    timeLabel: card.timeLabel,
    placeLabel: card.locationLine,
    relativeLabel: diffHours <= 24 ? `Dans ${diffHours} h` : card.timeLabel,
    imageUrl: card.imageUrl,
    href: card.href,
  };
}

export function buildSortirDesktopWeekendSpotlight(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  now?: Date;
}): SortirDesktopWeekendCard | null {
  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);

  const weekendEvents = filterAgendaUpcomingEvents(input.events, now).filter((event) => {
    const startsAt = Date.parse(event.starts_at);
    if (!Number.isFinite(startsAt)) return false;
    const eventDate = new Date(startsAt);
    if (eventDate.getTime() < todayStart.getTime()) return false;
    for (let i = 0; i < 14; i += 1) {
      const cursor = new Date(todayStart);
      cursor.setDate(cursor.getDate() + i);
      if (!isWeekendDay(cursor)) continue;
      const dayStart = startOfDay(cursor);
      const dayEnd = endOfDay(cursor);
      if (startsAt >= dayStart.getTime() && startsAt <= dayEnd.getTime()) return true;
    }
    return false;
  });

  const spotlight = weekendEvents[0];
  if (!spotlight) return null;

  const cards = buildSortirLiveEventCards({
    city: input.city,
    events: [spotlight],
    culturalPlaces: input.culturalPlaces,
    maxItems: 1,
    now,
  });
  const card = cards[0];
  if (!card) return null;

  const eventDate = new Date(spotlight.starts_at);
  const dayLabel = eventDate.getDay() === 6 ? "Samedi" : eventDate.getDay() === 0 ? "Dimanche" : "Ce week-end";

  return {
    id: card.id,
    title: card.title,
    dayLabel,
    imageUrl: card.imageUrl,
    href: card.href,
  };
}

export function resolveSortirDesktopEditorialMoment(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 18) return "AUJOURD'HUI";
  return "AUJOURD'HUI";
}
