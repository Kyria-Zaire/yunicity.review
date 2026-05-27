import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";

import { eventCalendarDayKey } from "./events-agenda";
import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";
import { buildMapEventUrl, buildMapPlaceUrl } from "./explorer-links";
import { neighborhoodHref } from "./neighborhood-labels";

export type NeighborhoodAtmosphereTag = "culture" | "soiree" | "calme" | "balade" | "etudiant";

export type NeighborhoodAtmosphereItem = {
  id: string;
  neighborhoodSlug: string;
  name: string;
  editorialLine: string;
  tags: NeighborhoodAtmosphereTag[];
  imageUrl: string | null;
  accentColor: string | null;
  neighborhoodHref: string;
  mapHref: string;
};

export type BuildNeighborhoodAtmosphereInput = {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes?: Tribe[];
  passportOffers?: PartnerOffer[];
  weatherCalm?: boolean;
  maxItems?: number;
  now?: Date;
};

export const NEIGHBORHOOD_ATMOSPHERE_MAX_ITEMS = 6;

const CULTURAL_EVENT_TYPES = new Set([
  "exhibition",
  "local_concert",
  "workshop",
  "partner_event",
  "association_evening",
]);

const LIVELY_DAY_EVENT_TYPES = new Set(["market", "local_market", "meetup", "cafe_meetup"]);

const EVENING_HOUR = 18;
const LATE_EVENING_HOUR = 20;

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function eventBelongsToNeighborhood(event: LocalEvent, hood: Neighborhood): boolean {
  const summarySlug = event.neighborhood_summary?.slug?.trim();
  if (summarySlug && summarySlug === hood.slug) {
    return true;
  }

  const districtKey = normalizeKey(event.district ?? "");
  const hoodSlugKey = normalizeKey(hood.slug);
  const hoodNameKey = normalizeKey(hood.display_name);

  if (!districtKey) {
    return false;
  }

  return (
    districtKey === hoodSlugKey ||
    districtKey === hoodNameKey ||
    districtKey.includes(hoodSlugKey) ||
    hoodSlugKey.includes(districtKey) ||
    districtKey.includes(hoodNameKey) ||
    hoodNameKey.includes(districtKey)
  );
}

export function culturalPlaceBelongsToNeighborhood(
  place: CulturalPlaceListItem,
  hood: Neighborhood,
): boolean {
  const slug = place.neighborhood?.slug?.trim();
  return Boolean(slug && slug === hood.slug);
}

function isCulturalEventType(eventType: string | null | undefined): boolean {
  const type = eventType?.trim().toLowerCase();
  return Boolean(type && CULTURAL_EVENT_TYPES.has(type));
}

function isLivelyDayEventType(eventType: string | null | undefined): boolean {
  const type = eventType?.trim().toLowerCase();
  return Boolean(type && LIVELY_DAY_EVENT_TYPES.has(type));
}

function eventStartsOnDay(event: LocalEvent, dayKey: string): boolean {
  return eventCalendarDayKey(event.starts_at) === dayKey;
}

function isEveningEvent(event: LocalEvent, late = false): boolean {
  const hour = new Date(event.starts_at).getHours();
  if (Number.isNaN(hour)) {
    return false;
  }
  return late ? hour >= LATE_EVENING_HOUR : hour >= EVENING_HOUR;
}

type HoodSignals = {
  eventsToday: LocalEvent[];
  eveningEvents: LocalEvent[];
  lateEveningEvents: LocalEvent[];
  culturalToday: LocalEvent[];
  livelyToday: LocalEvent[];
  studentToday: LocalEvent[];
  upcomingWeek: LocalEvent[];
  places: CulturalPlaceListItem[];
};

function collectHoodSignals(
  hood: Neighborhood,
  events: LocalEvent[],
  culturalPlaces: CulturalPlaceListItem[],
  todayKey: string,
): HoodSignals {
  const hoodEvents = events.filter(
    (event) => !event.is_cancelled && eventBelongsToNeighborhood(event, hood),
  );
  const eventsToday = hoodEvents.filter((event) => eventStartsOnDay(event, todayKey));
  const eveningEvents = eventsToday.filter((event) => isEveningEvent(event));
  const lateEveningEvents = eventsToday.filter((event) => isEveningEvent(event, true));

  return {
    eventsToday,
    eveningEvents,
    lateEveningEvents,
    culturalToday: eventsToday.filter((event) => isCulturalEventType(event.event_type)),
    livelyToday: eventsToday.filter((event) => isLivelyDayEventType(event.event_type)),
    studentToday: eventsToday.filter(
      (event) => event.event_type?.trim().toLowerCase() === "student_event",
    ),
    upcomingWeek: hoodEvents,
    places: culturalPlaces.filter((place) => culturalPlaceBelongsToNeighborhood(place, hood)),
  };
}

function buildAtmosphereTags(signals: HoodSignals, hood: Neighborhood): NeighborhoodAtmosphereTag[] {
  const tags: NeighborhoodAtmosphereTag[] = [];
  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";

  if (signals.culturalToday.length > 0 || signals.places.length > 0 || ambiance === "cultural") {
    tags.push("culture");
  }
  if (signals.eveningEvents.length > 0) {
    tags.push("soiree");
  }
  if (
    signals.eventsToday.length === 0 ||
    ambiance === "calm" ||
    (signals.eventsToday.length <= 1 && signals.eveningEvents.length === 0)
  ) {
    tags.push("calme");
  }
  if (signals.places.length > 0 || ambiance === "green" || ambiance === "cultural") {
    tags.push("balade");
  }
  if (signals.studentToday.length > 0 || ambiance === "student") {
    tags.push("etudiant");
  }

  return [...new Set(tags)].slice(0, 3);
}

export function buildNeighborhoodAtmosphereEditorialLine(
  hood: Neighborhood,
  signals: HoodSignals,
  weatherCalm: boolean,
): string {
  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";
  const { eventsToday, eveningEvents, lateEveningEvents, culturalToday, livelyToday, places } =
    signals;

  if (eventsToday.length === 0) {
    if (places.length >= 2) {
      return "Des repères culturels invitent à une halte tranquille dans le quartier.";
    }
    if (places.length === 1) {
      return "Un lieu culturel donne le ton d’une journée paisible ici.";
    }
    if (weatherCalm || ambiance === "calm" || ambiance === "green") {
      return "Quartier plus calme aujourd’hui.";
    }
    return "Le quartier reste paisible aujourd’hui.";
  }

  if (livelyToday.length >= 1 && (livelyToday.some((e) => e.event_type === "market") || livelyToday.length >= 2)) {
    return "Les terrasses et marchés gardent le quartier vivant aujourd’hui.";
  }

  if (culturalToday.length >= 1 && eveningEvents.length >= 1) {
    return "Quelques sorties culturelles animent le quartier ce soir.";
  }

  if (lateEveningEvents.length >= 1 || (eveningEvents.length >= 1 && ambiance === "lively")) {
    return "L’ambiance devient plus animée après 20 h.";
  }

  if (culturalToday.length >= 1 || places.length >= 1) {
    return "Une touche culturelle colore la journée dans le quartier.";
  }

  if (eveningEvents.length >= 1) {
    return "Le quartier prend un rythme plus doux en soirée.";
  }

  return "Le quartier garde un rythme lisible et humain aujourd’hui.";
}

export function resolveNeighborhoodAtmosphereMapHref(
  hood: Neighborhood,
  events: LocalEvent[],
  culturalPlaces: CulturalPlaceListItem[],
  city: string,
): string {
  const hoodEvent = events.find(
    (event) =>
      !event.is_cancelled &&
      eventBelongsToNeighborhood(event, hood) &&
      event.latitude != null &&
      event.longitude != null,
  );
  if (hoodEvent) {
    return buildMapEventUrl(hoodEvent.id, { city });
  }

  const hoodPlace = culturalPlaces.find(
    (place) => culturalPlaceBelongsToNeighborhood(place, hood) && place.latitude != null,
  );
  if (hoodPlace) {
    return buildMapPlaceUrl(hoodPlace.slug, { city });
  }

  return `/map?city=${encodeURIComponent(city)}`;
}

function scoreNeighborhood(hood: Neighborhood, signals: HoodSignals): number {
  let score = hood.is_featured ? 100 : 0;
  score += signals.eventsToday.length * 12;
  score += signals.places.length * 8;
  score += signals.upcomingWeek.length * 3;
  if (resolveNeighborhoodEditorialImage(hood)) {
    score += 5;
  }
  return score;
}

export function buildNeighborhoodAtmosphereItems({
  city,
  neighborhoods,
  events,
  culturalPlaces,
  weatherCalm = true,
  maxItems = NEIGHBORHOOD_ATMOSPHERE_MAX_ITEMS,
  now = new Date(),
}: BuildNeighborhoodAtmosphereInput): NeighborhoodAtmosphereItem[] {
  const activeCity = city.trim() || "Reims";
  const todayKey = eventCalendarDayKey(now.toISOString());
  const activeHoods = neighborhoods.filter((hood) => hood.is_active);

  const ranked = activeHoods
    .map((hood) => {
      const signals = collectHoodSignals(hood, events, culturalPlaces, todayKey);
      return { hood, signals, score: scoreNeighborhood(hood, signals) };
    })
    .sort((a, b) => b.score - a.score || a.hood.display_name.localeCompare(b.hood.display_name, "fr"));

  const items: NeighborhoodAtmosphereItem[] = [];

  for (const { hood, signals } of ranked) {
    if (items.length >= maxItems) {
      break;
    }

    items.push({
      id: `neighborhood:${hood.slug}`,
      neighborhoodSlug: hood.slug,
      name: hood.display_name,
      editorialLine: buildNeighborhoodAtmosphereEditorialLine(hood, signals, weatherCalm),
      tags: buildAtmosphereTags(signals, hood),
      imageUrl: resolveNeighborhoodEditorialImage(hood),
      accentColor: hood.accent_color,
      neighborhoodHref: neighborhoodHref(hood.slug, activeCity),
      mapHref: resolveNeighborhoodAtmosphereMapHref(hood, events, culturalPlaces, activeCity),
    });
  }

  return items;
}

/** Vérifie qu’aucune métrique d’engagement ou score n’est injecté. */
export function neighborhoodAtmosphereHasNoEngagementMetrics(
  items: NeighborhoodAtmosphereItem[],
): boolean {
  const banned =
    /\d+\s*(personnes|participants|visiteurs|utilisateurs)|score|très actif|heatmap|#\d+|trending|populaire|viral/i;
  return items.every(
    (item) =>
      !banned.test(item.editorialLine) &&
      !banned.test(item.name) &&
      !item.tags.some((tag) => banned.test(tag)),
  );
}
