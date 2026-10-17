import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  Tribe,
} from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import {
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  resolveNeighborhoodEditorialImage,
} from "./editorial-fallback-images";
import { buildMapEventUrl, buildMapNeighborhoodUrl } from "./explorer-links";
import {
  buildNeighborhoodMomentAtmosphereLine,
  culturalPlaceBelongsToNeighborhood,
  eventBelongsToNeighborhood,
} from "./neighborhood-atmosphere";
import { neighborhoodAmbianceLabel, neighborhoodHref } from "./neighborhood-labels";
import { neighborhoodHeroTagline } from "./neighborhood-detail";
import { tribeHref } from "./tribe-labels";

export type NeighborhoodsPortalStats = {
  neighborhoodsCount: number;
  activeMomentsCount: number;
  cafesCount: number;
  eventsThisWeek: number;
};

export type NeighborhoodFeaturedCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  headline: string;
  description: string;
  themeSlug: string;
  momentsCount: number;
  cafesCount: number;
  eventsThisWeek: number;
  href: string;
};

export type NeighborhoodListCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  tagline: string;
  momentsCount: number;
  href: string;
};

export const NEIGHBORHOOD_PORTAL_THEME_SLUGS = [
  "saint-remi",
  "centre-ville",
  "cernay-jean-jaures",
  "clairmarais",
  "croix-rouge",
] as const;

export type NeighborhoodPortalThemeSlug = (typeof NEIGHBORHOOD_PORTAL_THEME_SLUGS)[number];

const FEATURED_HEADLINE_BY_SLUG: Record<string, string> = {
  "centre-ville": "Le cœur historique",
  "saint-remi": "Le quartier qui respire aujourd’hui",
  "cernay-jean-jaures": "Le quartier gourmand",
  clairmarais: "Vie locale au quotidien",
  "croix-rouge": "Vie locale et esprit de quartier",
};

const CAFE_CATEGORY_PATTERN = /cafe|café|gastronomie|restaurant|brasserie|boulangerie|bar\b/i;

export const NEIGHBORHOOD_PORTAL_MOODS = [
  "calme",
  "culture",
  "sortir",
  "marcher",
  "famille",
  "cafe-lecture",
  "soiree-douce",
  "patrimoine",
] as const;

export type NeighborhoodPortalMood = (typeof NEIGHBORHOOD_PORTAL_MOODS)[number];

export type CityNeighborhoodPulseItem = {
  id: string;
  neighborhoodSlug: string;
  line: string;
  href: string;
};

export type NeighborhoodPortalSignal = {
  label: string;
  href: string;
};

export type NeighborhoodPortalCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  tagline: string;
  ambianceLabel: string;
  moods: NeighborhoodPortalMood[];
  signals: NeighborhoodPortalSignal[];
  href: string;
  mapHref: string;
};

export type NeighborhoodLifeSlice = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "event" | "place" | "tribe" | "offer";
};

const BANNED_METRIC_PATTERN =
  /\d+\s*(personnes|participants|visiteurs|utilisateurs)|score|très actif|heatmap|#\d+|trending|populaire|viral/i;

function resolveCardMoods(
  hood: Neighborhood,
  events: LocalEvent[],
  places: CulturalPlaceListItem[],
): NeighborhoodPortalMood[] {
  const moods = new Set<NeighborhoodPortalMood>();
  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";
  const hoodEvents = events.filter((event) => eventBelongsToNeighborhood(event, hood));
  const hoodPlaces = places.filter((place) => place.neighborhood?.slug === hood.slug);
  const hasEvening = hoodEvents.some((event) => new Date(event.starts_at).getHours() >= 18);
  const hasMarket = hoodEvents.some((event) => {
    const type = event.event_type?.trim().toLowerCase();
    return type === "market" || type === "local_market";
  });
  const hasCulture = hoodEvents.some((event) => {
    const type = event.event_type?.trim().toLowerCase();
    return type === "local_concert" || type === "exhibition" || type === "workshop";
  });

  if (ambiance === "calm" || hoodEvents.length <= 1) moods.add("calme");
  if (ambiance === "cultural" || hasCulture || hoodPlaces.length > 0) moods.add("culture");
  if (hasEvening) moods.add("sortir");
  if (ambiance === "green" || hoodPlaces.length > 0) moods.add("marcher");
  if (hasMarket) moods.add("famille");
  if (hasEvening && hoodEvents.length <= 2) moods.add("soiree-douce");
  if (hoodPlaces.some((place) => place.category.toLowerCase().includes("cafe"))) moods.add("cafe-lecture");
  if (
    hoodPlaces.some((place) => {
      const category = place.category.toLowerCase();
      return category.includes("monument") || category.includes("heritage") || category.includes("patrimoine");
    })
  ) {
    moods.add("patrimoine");
  }
  if (moods.size === 0) moods.add("marcher");
  return [...moods].slice(0, 4);
}

function buildCardSignals(
  hood: Neighborhood,
  city: string,
  events: LocalEvent[],
  places: CulturalPlaceListItem[],
  tribes: Tribe[],
  offers: PartnerOfferPublic[],
): NeighborhoodPortalSignal[] {
  const signals: NeighborhoodPortalSignal[] = [];
  const hoodEvent = events.find((event) => eventBelongsToNeighborhood(event, hood));
  const hoodPlace = places.find((place) => place.neighborhood?.slug === hood.slug);

  if (hoodEvent) {
    signals.push({
      label: `Moment: ${hoodEvent.title}`,
      href: `/events/${hoodEvent.id}`,
    });
  }
  if (hoodPlace) {
    signals.push({
      label: `Lieu: ${hoodPlace.name}`,
      href: `/map?place=${encodeURIComponent(hoodPlace.slug)}&city=${encodeURIComponent(city)}`,
    });
  }
  if (signals.length < 2 && tribes[0]) {
    signals.push({
      label: `Tribus: ${tribes[0].name}`,
      href: tribeHref(tribes[0].slug, city),
    });
  }
  if (signals.length < 2 && offers[0]) {
    signals.push({
      label: `Passport: ${offers[0].title}`,
      href: "/passport",
    });
  }

  return signals.slice(0, 2);
}

export function buildCityNeighborhoodPulse(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  weatherCalm?: boolean;
  maxItems?: number;
}): CityNeighborhoodPulseItem[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const active = input.neighborhoods.filter((hood) => hood.is_active).slice(0, 8);

  const lines = active.map((hood) => ({
    id: hood.id,
    neighborhoodSlug: hood.slug,
    line: buildNeighborhoodMomentAtmosphereLine(hood, input.events, input.culturalPlaces, {
      weatherCalm: input.weatherCalm ?? true,
    }),
    href: neighborhoodHref(hood.slug, city),
  }));

  const filtered = lines.filter((item) => !BANNED_METRIC_PATTERN.test(item.line));
  if (filtered.length > 0) {
    return filtered.slice(0, maxItems);
  }
  return active.slice(0, Math.min(3, maxItems)).map((hood) => ({
    id: hood.id,
    neighborhoodSlug: hood.slug,
    line: `${hood.display_name} garde un rythme calme aujourd’hui.`,
    href: neighborhoodHref(hood.slug, city),
  }));
}

export function buildNeighborhoodCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  offers: PartnerOfferPublic[];
}): NeighborhoodPortalCard[] {
  const city = input.city.trim() || "Reims";
  const upcoming = input.events.filter((event) => !event.is_cancelled);

  return input.neighborhoods
    .filter((hood) => hood.is_active)
    .map((hood) => {
      const cardEvents = upcoming.filter((event) => eventBelongsToNeighborhood(event, hood));
      const cardPlaces = input.culturalPlaces.filter((place) => place.neighborhood?.slug === hood.slug);
      const ambiance = neighborhoodAmbianceLabel(hood.ambiance);

      return {
        id: hood.id,
        slug: hood.slug,
        name: hood.display_name,
        imageUrl: resolveNeighborhoodEditorialImage(hood),
        tagline: neighborhoodHeroTagline(hood),
        ambianceLabel: ambiance ? `Ambiance ${ambiance}` : "Ambiance locale",
        moods: resolveCardMoods(hood, cardEvents, cardPlaces),
        signals: buildCardSignals(
          hood,
          city,
          cardEvents,
          cardPlaces,
          input.tribes,
          input.offers,
        ),
        href: neighborhoodHref(hood.slug, city),
        mapHref: buildMapNeighborhoodUrl(hood.slug, { city }),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function filterNeighborhoodCardsByMood(
  cards: NeighborhoodPortalCard[],
  mood: NeighborhoodPortalMood | "",
): NeighborhoodPortalCard[] {
  if (!mood) return cards;
  return cards.filter((card) => card.moods.includes(mood));
}

export function buildNeighborhoodLifeSlices(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  offers: PartnerOfferPublic[];
  maxItems?: number;
}): NeighborhoodLifeSlice[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const slices: NeighborhoodLifeSlice[] = [];
  const event = input.events.find((item) => !item.is_cancelled);
  const place = input.culturalPlaces[0];
  const tribe = input.tribes.find((item) => !item.is_archived);
  const offer = input.offers[0];

  if (event) {
    slices.push({
      id: `event-${event.id}`,
      title: event.title,
      subtitle: formatEventDateRange(event.starts_at, event.ends_at),
      href: `/events/${event.id}`,
      kind: "event",
    });
  }
  if (place) {
    slices.push({
      id: `place-${place.id}`,
      title: place.name,
      subtitle: place.editorial_excerpt || place.short_description,
      href: `/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(city)}`,
      kind: "place",
    });
  }
  if (tribe) {
    slices.push({
      id: `tribe-${tribe.id}`,
      title: tribe.name,
      subtitle: "Tribus locales à découvrir",
      href: tribeHref(tribe.slug, city),
      kind: "tribe",
    });
  }
  if (offer) {
    slices.push({
      id: `offer-${offer.id}`,
      title: offer.title,
      subtitle: offer.partner.name,
      href: "/passport",
      kind: "offer",
    });
  }

  return slices.slice(0, maxItems);
}

export function neighborhoodPortalHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}

function isWithinNextDays(iso: string, days: number, now = new Date()): boolean {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return false;
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + days);
  return start >= now && start <= horizon;
}

function isCafeCulturalPlace(place: CulturalPlaceListItem): boolean {
  return CAFE_CATEGORY_PATTERN.test(place.category);
}

function resolveFeaturedDescription(hood: Neighborhood): string {
  const short = hood.short_description?.trim();
  if (!short) {
    return neighborhoodHeroTagline(hood);
  }
  const parts = short.split(/\s*[—–-]\s+/);
  if (parts.length >= 2) {
    return parts.slice(1).join(" — ").trim();
  }
  const sentences = short.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return sentences.slice(1).join(" ");
  }
  return short;
}

export function resolveNeighborhoodFeaturedHeadline(hood: Neighborhood): string {
  const slugKey = hood.slug.trim().toLowerCase();
  if (FEATURED_HEADLINE_BY_SLUG[slugKey]) {
    return FEATURED_HEADLINE_BY_SLUG[slugKey]!;
  }
  const short = hood.short_description?.trim();
  if (short) {
    const beforeDash = short.split(/\s*[—–-]\s+/)[0]?.trim();
    if (beforeDash && beforeDash.length <= 72) {
      return beforeDash.replace(/\s+de\s+Reims$/i, "").trim() || beforeDash;
    }
  }
  return neighborhoodHeroTagline(hood);
}

export function resolveNeighborhoodPortalThemeSlug(hood: Neighborhood): NeighborhoodPortalThemeSlug {
  const slug = hood.slug.trim().toLowerCase();
  if (NEIGHBORHOOD_PORTAL_THEME_SLUGS.includes(slug as NeighborhoodPortalThemeSlug)) {
    return slug as NeighborhoodPortalThemeSlug;
  }
  return "centre-ville";
}

function countHoodMoments(hood: Neighborhood, events: LocalEvent[]): number {
  return events.filter(
    (event) => !event.is_cancelled && eventBelongsToNeighborhood(event, hood),
  ).length;
}

function countHoodCafes(hood: Neighborhood, places: CulturalPlaceListItem[]): number {
  return places.filter(
    (place) => culturalPlaceBelongsToNeighborhood(place, hood) && isCafeCulturalPlace(place),
  ).length;
}

function countHoodEventsThisWeek(
  hood: Neighborhood,
  events: LocalEvent[],
  now = new Date(),
): number {
  return events.filter(
    (event) =>
      !event.is_cancelled &&
      eventBelongsToNeighborhood(event, hood) &&
      isWithinNextDays(event.starts_at, 7, now),
  ).length;
}

export function buildNeighborhoodsPortalStats(input: {
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  now?: Date;
}): NeighborhoodsPortalStats {
  const now = input.now ?? new Date();
  const active = input.neighborhoods.filter((hood) => hood.is_active);
  const upcoming = input.events.filter((event) => !event.is_cancelled);

  return {
    neighborhoodsCount: active.length,
    activeMomentsCount: upcoming.length,
    cafesCount: input.culturalPlaces.filter(isCafeCulturalPlace).length,
    eventsThisWeek: upcoming.filter((event) => isWithinNextDays(event.starts_at, 7, now)).length,
  };
}

/** Image fixe du bandeau portail — indépendante du pick quartier/lieu du jour. */
export function resolveNeighborhoodsPortalHeroImage(
  _neighborhoods: Neighborhood[],
  _culturalPlaces: CulturalPlaceListItem[],
): string {
  return NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;
}

export function buildNeighborhoodFeaturedCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): NeighborhoodFeaturedCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const now = input.now ?? new Date();
  const upcoming = input.events.filter((event) => !event.is_cancelled);

  return input.neighborhoods
    .filter((hood) => hood.is_active)
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return countHoodMoments(b, upcoming) - countHoodMoments(a, upcoming);
    })
    .slice(0, maxItems)
    .map((hood) => ({
      id: hood.id,
      slug: hood.slug,
      name: hood.display_name,
      imageUrl: resolveNeighborhoodEditorialImage(hood),
      headline: resolveNeighborhoodFeaturedHeadline(hood),
      description: resolveFeaturedDescription(hood),
      themeSlug: resolveNeighborhoodPortalThemeSlug(hood),
      momentsCount: countHoodMoments(hood, upcoming),
      cafesCount: countHoodCafes(hood, input.culturalPlaces),
      eventsThisWeek: countHoodEventsThisWeek(hood, upcoming, now),
      href: neighborhoodHref(hood.slug, city),
    }));
}

export function buildNeighborhoodListCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  /** Si fourni, exclut ces slugs (ex. cartes déjà en « À découvrir »). */
  excludeSlugs?: string[];
  maxItems?: number;
}): NeighborhoodListCard[] {
  const city = input.city.trim() || "Reims";
  const excluded = new Set((input.excludeSlugs ?? []).map((slug) => slug.trim().toLowerCase()));
  const upcoming = input.events.filter((event) => !event.is_cancelled);

  return input.neighborhoods
    .filter((hood) => hood.is_active && !excluded.has(hood.slug.trim().toLowerCase()))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "fr"))
    .slice(0, input.maxItems ?? 12)
    .map((hood) => ({
      id: hood.id,
      slug: hood.slug,
      name: hood.display_name,
      imageUrl: resolveNeighborhoodEditorialImage(hood),
      tagline: neighborhoodHeroTagline(hood),
      momentsCount: countHoodMoments(hood, upcoming),
      href: neighborhoodHref(hood.slug, city),
    }));
}

