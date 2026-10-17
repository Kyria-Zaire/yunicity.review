import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";

import {
  resolveNeighborhoodEditorialImage,
  resolveNeighborhoodEditorialImageCredit,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  type EditorialImageCredit,
} from "./editorial-fallback-images";
import { buildMapNeighborhoodUrl } from "./explorer-links";
import {
  culturalPlaceBelongsToNeighborhood,
  eventBelongsToNeighborhood,
} from "./neighborhood-atmosphere";
import { neighborhoodHeroTagline } from "./neighborhood-detail";
import { neighborhoodHref } from "./neighborhood-labels";
import { isPendingYunicityHostedCoverUrl, resolveMapPlaceImageUrl } from "./map-media-url";
import {
  NEIGHBORHOODS_DESKTOP_AMBIANCE_CALM,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_CULTURAL,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_FAMILY,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_GREEN,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_LIVELY,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_STUDENT,
  NEIGHBORHOODS_DESKTOP_ENVIE_MANGER,
  NEIGHBORHOODS_DESKTOP_ENVIE_PARTICIPATE,
  NEIGHBORHOODS_DESKTOP_ENVIE_SORTIR,
  NEIGHBORHOODS_DESKTOP_ENVIE_WALK,
  NEIGHBORHOODS_DESKTOP_NAV_ALL,
  NEIGHBORHOODS_DESKTOP_NAV_FOLLOWED,
  NEIGHBORHOODS_DESKTOP_NAV_MINE,
  NEIGHBORHOODS_DESKTOP_NAV_NEAR,
  NEIGHBORHOODS_DESKTOP_TODAY,
} from "./neighborhoods-desktop-labels";
import {
  resolveNeighborhoodFeaturedHeadline,
  type NeighborhoodPortalMood,
} from "./neighborhood-portal";

const MEDIA_CDN_HOST = /^media\.(?:[a-z0-9-]+\.)?yunicity\.city$/i;

function isUnpopulatedMediaCdnCoverUrl(url: string): boolean {
  try {
    return MEDIA_CDN_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Crédit de l'image que `resolveNeighborhoodsDesktopImage` va rendre.
 *
 * Même première branche que lui : la photo Wikimedia du slug prime toujours, donc son crédit
 * est le bon dès qu'elle existe. Les autres sources (cover API, photo de lieu, hero portail)
 * portent leur propre attribution — on renvoie `null` pour ne jamais afficher le crédit
 * d'une image qui n'est pas à l'écran.
 */
export function resolveNeighborhoodsDesktopImageCredit(
  hood: Pick<Neighborhood, "slug">,
): EditorialImageCredit | null {
  return resolveNeighborhoodEditorialImageCredit({ slug: hood.slug, cover_image_url: null });
}

/** Cover Reims Commons (slug) → cover API fiable → photo lieu → hero portail. */
export function resolveNeighborhoodsDesktopImage(
  hood: Pick<Neighborhood, "slug" | "cover_image_url">,
  places: CulturalPlaceListItem[] = [],
): string {
  // Toujours préférer la photo Wikimedia du quartier quand elle existe
  // (évite Unsplash Berlin/NYC ou covers CDN encore vides).
  const bySlug = resolveNeighborhoodEditorialImage({
    slug: hood.slug,
    cover_image_url: null,
  });
  if (bySlug) return bySlug;

  const cover = hood.cover_image_url?.trim();
  if (
    cover &&
    !isPendingYunicityHostedCoverUrl(cover) &&
    !isUnpopulatedMediaCdnCoverUrl(cover)
  ) {
    return cover;
  }

  if (cover && !isPendingYunicityHostedCoverUrl(cover)) {
    return cover;
  }

  const placeImage = places
    .filter((place) => place.neighborhood?.slug === hood.slug)
    .map((place) => resolveMapPlaceImageUrl(place))
    .find((url): url is string => Boolean(url));
  if (placeImage) return placeImage;

  return NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;
}

function resolveDesktopDescription(hood: Neighborhood): string {
  const short = hood.short_description?.trim();
  if (!short) return neighborhoodHeroTagline(hood);
  const parts = short.split(/\s*[—–-]\s+/);
  if (parts.length >= 2) return parts.slice(1).join(" — ").trim();
  const sentences = short.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) return sentences.slice(1).join(" ");
  return short;
}

export type NeighborhoodsDesktopDiscoverId = "all" | "near" | "mine" | "followed";

export type NeighborhoodsDesktopAmbianceId =
  | "lively"
  | "cultural"
  | "family"
  | "student"
  | "calm"
  | "green";

export type NeighborhoodsDesktopEnvieId = "sortir" | "manger" | "walk" | "participate";

export type NeighborhoodsDesktopFilters = {
  discover: NeighborhoodsDesktopDiscoverId;
  ambiances: NeighborhoodsDesktopAmbianceId[];
  envies: NeighborhoodsDesktopEnvieId[];
  query: string;
  followedSlugs: string[];
};

export type NeighborhoodsDesktopTag = {
  id: string;
  label: string;
  tone: "peach" | "purple" | "yellow" | "blue" | "indigo" | "green" | "slate";
};

export type NeighborhoodsDesktopHeroCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  description: string;
  tags: NeighborhoodsDesktopTag[];
  eventLine: string | null;
  href: string;
  mapHref: string;
};

export type NeighborhoodsDesktopGridCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  tags: NeighborhoodsDesktopTag[];
  eventLine: string | null;
  href: string;
};

export type NeighborhoodsDesktopActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
};

export type NeighborhoodsDesktopRecentItem = {
  id: string;
  body: string;
  imageUrl: string | null;
  href: string;
};

export const NEIGHBORHOODS_DESKTOP_DISCOVER_ITEMS: {
  id: NeighborhoodsDesktopDiscoverId;
  label: string;
}[] = [
  { id: "all", label: NEIGHBORHOODS_DESKTOP_NAV_ALL },
  { id: "near", label: NEIGHBORHOODS_DESKTOP_NAV_NEAR },
  { id: "mine", label: NEIGHBORHOODS_DESKTOP_NAV_MINE },
  { id: "followed", label: NEIGHBORHOODS_DESKTOP_NAV_FOLLOWED },
];

export const NEIGHBORHOODS_DESKTOP_AMBIANCE_ITEMS: {
  id: NeighborhoodsDesktopAmbianceId;
  label: string;
  tone: NeighborhoodsDesktopTag["tone"];
}[] = [
  { id: "lively", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_LIVELY, tone: "peach" },
  { id: "cultural", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_CULTURAL, tone: "purple" },
  { id: "family", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_FAMILY, tone: "yellow" },
  { id: "student", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_STUDENT, tone: "blue" },
  { id: "calm", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_CALM, tone: "indigo" },
  { id: "green", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_GREEN, tone: "green" },
];

export const NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS: {
  id: NeighborhoodsDesktopEnvieId;
  label: string;
}[] = [
  { id: "sortir", label: NEIGHBORHOODS_DESKTOP_ENVIE_SORTIR },
  { id: "manger", label: NEIGHBORHOODS_DESKTOP_ENVIE_MANGER },
  { id: "walk", label: NEIGHBORHOODS_DESKTOP_ENVIE_WALK },
  { id: "participate", label: NEIGHBORHOODS_DESKTOP_ENVIE_PARTICIPATE },
];

export const NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS: NeighborhoodsDesktopFilters = {
  discover: "all",
  ambiances: [],
  envies: [],
  query: "",
  followedSlugs: [],
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatEventClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatNeighborhoodsDesktopEventLine(
  event: LocalEvent | null | undefined,
  now = new Date(),
): string | null {
  if (!event || event.is_cancelled) return null;
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return null;
  const time = formatEventClock(event.starts_at);
  const when = isSameDay(start, now) ? NEIGHBORHOODS_DESKTOP_TODAY : start.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${when} · ${event.title}${time ? ` · ${time}` : ""}`;
}

function resolveHoodTags(
  hood: Neighborhood,
  events: LocalEvent[],
  places: CulturalPlaceListItem[],
): NeighborhoodsDesktopTag[] {
  const tags: NeighborhoodsDesktopTag[] = [];
  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";
  const hoodEvents = events.filter((event) => eventBelongsToNeighborhood(event, hood));
  const hoodPlaces = places.filter((place) => culturalPlaceBelongsToNeighborhood(place, hood));

  if (ambiance === "lively") {
    tags.push({ id: "lively", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_LIVELY, tone: "peach" });
  }
  if (ambiance === "cultural" || hoodPlaces.length > 0) {
    tags.push({ id: "cultural", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_CULTURAL, tone: "purple" });
  }
  if (ambiance === "student") {
    tags.push({ id: "student", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_STUDENT, tone: "blue" });
  }
  if (ambiance === "calm" || hoodEvents.length <= 1) {
    tags.push({ id: "calm", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_CALM, tone: "indigo" });
  }
  if (ambiance === "green") {
    tags.push({ id: "green", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_GREEN, tone: "green" });
  }
  if (
    hoodPlaces.some((place) => {
      const category = place.category.toLowerCase();
      return category.includes("monument") || category.includes("heritage") || category.includes("patrimoine");
    })
  ) {
    tags.push({ id: "patrimoine", label: "Patrimoine", tone: "slate" });
  }
  if (tags.length === 0) {
    tags.push({ id: "local", label: "Local", tone: "slate" });
  }
  return tags.slice(0, 3);
}

function hoodMatchesAmbiance(hood: Neighborhood, ambianceId: NeighborhoodsDesktopAmbianceId): boolean {
  const ambiance = hood.ambiance?.trim().toLowerCase() ?? "";
  switch (ambianceId) {
    case "lively":
      return ambiance === "lively";
    case "cultural":
      return ambiance === "cultural";
    case "student":
      return ambiance === "student";
    case "calm":
      return ambiance === "calm";
    case "green":
      return ambiance === "green";
    case "family":
      return ambiance === "lively" || ambiance === "calm";
    default:
      return false;
  }
}

function hoodMatchesEnvie(
  hood: Neighborhood,
  envie: NeighborhoodsDesktopEnvieId,
  events: LocalEvent[],
  places: CulturalPlaceListItem[],
): boolean {
  const hoodEvents = events.filter((event) => eventBelongsToNeighborhood(event, hood));
  const hoodPlaces = places.filter((place) => culturalPlaceBelongsToNeighborhood(place, hood));
  switch (envie) {
    case "sortir":
      return hoodEvents.some((event) => new Date(event.starts_at).getHours() >= 17);
    case "manger":
      return hoodPlaces.some((place) =>
        /cafe|café|restaurant|brasserie|boulangerie|bar\b|gastronomie/i.test(place.category),
      );
    case "walk":
      return (hood.ambiance?.trim().toLowerCase() === "green") || hoodPlaces.length > 0;
    case "participate":
      return hoodEvents.length > 0;
    default:
      return false;
  }
}

function pickHoodEvent(hood: Neighborhood, events: LocalEvent[]): LocalEvent | undefined {
  return events.find(
    (event) => !event.is_cancelled && eventBelongsToNeighborhood(event, hood),
  );
}

export function filterNeighborhoodsForDesktop(
  neighborhoods: Neighborhood[],
  events: LocalEvent[],
  places: CulturalPlaceListItem[],
  filters: NeighborhoodsDesktopFilters,
): Neighborhood[] {
  const query = filters.query.trim().toLowerCase();
  const followed = new Set(filters.followedSlugs.map((slug) => slug.toLowerCase()));

  return neighborhoods
    .filter((hood) => hood.is_active)
    .filter((hood) => {
      if (filters.discover === "followed") return followed.has(hood.slug.toLowerCase());
      if (filters.discover === "near") {
        return hood.latitude != null && hood.longitude != null;
      }
      if (filters.discover === "mine") {
        // Pas d’API « mon quartier » sur le listing — on réutilise les suivis.
        return followed.has(hood.slug.toLowerCase());
      }
      return true;
    })
    .filter((hood) => {
      if (filters.ambiances.length === 0) return true;
      return filters.ambiances.some((ambiance) => hoodMatchesAmbiance(hood, ambiance));
    })
    .filter((hood) => {
      if (filters.envies.length === 0) return true;
      return filters.envies.every((envie) => hoodMatchesEnvie(hood, envie, events, places));
    })
    .filter((hood) => {
      if (!query) return true;
      const haystack = [
        hood.display_name,
        hood.short_description ?? "",
        hood.ambiance ?? "",
        neighborhoodHeroTagline(hood),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.display_name.localeCompare(b.display_name, "fr");
    });
}

export function buildNeighborhoodsDesktopHeroCard(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  now?: Date;
}): NeighborhoodsDesktopHeroCard | null {
  const city = input.city.trim() || "Reims";
  const hood =
    input.neighborhoods.find((item) => item.is_active && item.is_featured) ??
    input.neighborhoods.find((item) => item.is_active) ??
    null;
  if (!hood) return null;
  const event = pickHoodEvent(hood, input.events);
  return {
    id: hood.id,
    slug: hood.slug,
    name: hood.display_name,
    imageUrl: resolveNeighborhoodsDesktopImage(hood, input.culturalPlaces),
    description: resolveDesktopDescription(hood) || resolveNeighborhoodFeaturedHeadline(hood),
    tags: resolveHoodTags(hood, input.events, input.culturalPlaces),
    eventLine: formatNeighborhoodsDesktopEventLine(event, input.now),
    href: neighborhoodHref(hood.slug, city),
    mapHref: buildMapNeighborhoodUrl(hood.slug, { city }),
  };
}

export function buildNeighborhoodsDesktopGridCards(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  excludeSlug?: string;
  maxItems?: number;
  now?: Date;
}): NeighborhoodsDesktopGridCard[] {
  const city = input.city.trim() || "Reims";
  const exclude = input.excludeSlug?.trim().toLowerCase() ?? "";
  return input.neighborhoods
    .filter((hood) => hood.is_active && hood.slug.toLowerCase() !== exclude)
    .slice(0, input.maxItems ?? 4)
    .map((hood) => {
      const event = pickHoodEvent(hood, input.events);
      return {
        id: hood.id,
        slug: hood.slug,
        name: hood.display_name,
        imageUrl: resolveNeighborhoodsDesktopImage(hood, input.culturalPlaces),
        tags: resolveHoodTags(hood, input.events, input.culturalPlaces).slice(0, 2),
        eventLine: formatNeighborhoodsDesktopEventLine(event, input.now),
        href: neighborhoodHref(hood.slug, city),
      };
    });
}

export function buildNeighborhoodsDesktopNowItems(input: {
  city: string;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces?: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): NeighborhoodsDesktopActivityItem[] {
  const city = input.city.trim() || "Reims";
  const now = input.now ?? new Date();
  const places = input.culturalPlaces ?? [];
  return input.events
    .filter((event) => !event.is_cancelled)
    .slice(0, input.maxItems ?? 3)
    .map((event) => {
      const hood = input.neighborhoods.find((item) => eventBelongsToNeighborhood(event, item));
      const time = formatEventClock(event.starts_at);
      const cover = event.cover_image_url?.trim();
      const eventImage =
        cover && !isPendingYunicityHostedCoverUrl(cover)
          ? cover
          : hood
            ? resolveNeighborhoodsDesktopImage(hood, places)
            : NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;
      return {
        id: event.id,
        title: hood ? `${hood.display_name} · ${event.title}` : event.title,
        subtitle: formatNeighborhoodsDesktopEventLine(event, now) ?? time,
        imageUrl: eventImage,
        href: `/events/${event.id}?city=${encodeURIComponent(city)}`,
      };
    });
}

export function buildNeighborhoodsDesktopRecentItems(input: {
  city: string;
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): NeighborhoodsDesktopRecentItem[] {
  const city = input.city.trim() || "Reims";
  return input.culturalPlaces.slice(0, input.maxItems ?? 2).map((place) => ({
    id: place.id,
    body:
      place.editorial_excerpt?.trim() ||
      place.short_description?.trim() ||
      `${place.name} partage l’actualité du quartier.`,
    imageUrl: resolveMapPlaceImageUrl(place) ?? NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
    href: `/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(city)}`,
  }));
}

export function neighborhoodsDesktopFiltersAreActive(filters: NeighborhoodsDesktopFilters): boolean {
  return (
    filters.discover !== "all" ||
    filters.ambiances.length > 0 ||
    filters.envies.length > 0 ||
    filters.query.trim().length > 0
  );
}

const NEIGHBORHOODS_DESKTOP_MAP_PIN_COLORS = [
  "2A2FFF",
  "F97316",
  "10B981",
  "0EA5E9",
  "A855F7",
  "EC4899",
] as const;

function neighborhoodsWithMapCoords(
  neighborhoods: Pick<Neighborhood, "latitude" | "longitude">[],
): Array<{ latitude: number; longitude: number }> {
  return neighborhoods.filter(
    (hood): hood is { latitude: number; longitude: number } =>
      hood.latitude != null &&
      hood.longitude != null &&
      Number.isFinite(hood.latitude) &&
      Number.isFinite(hood.longitude),
  );
}

/** Centre géographique moyen des quartiers (fallback OSM / zoom unique). */
export function buildNeighborhoodsDesktopMapCenter(
  neighborhoods: Pick<Neighborhood, "latitude" | "longitude">[],
): { latitude: number; longitude: number } | null {
  const coords = neighborhoodsWithMapCoords(neighborhoods);
  if (coords.length === 0) return null;
  const latitude = coords.reduce((sum, item) => sum + item.latitude, 0) / coords.length;
  const longitude = coords.reduce((sum, item) => sum + item.longitude, 0) / coords.length;
  return { latitude, longitude };
}

/**
 * Preview Mapbox static multi-pins pour le bandeau « Comparer sur la carte ».
 * Utilise `auto` pour cadrer tous les quartiers quand il y en a plusieurs.
 */
export function buildNeighborhoodsDesktopMapPreviewUrl(
  neighborhoods: Pick<Neighborhood, "latitude" | "longitude">[],
  accessToken: string,
  options?: { width?: number; height?: number; maxPins?: number },
): string | null {
  const token = accessToken.trim();
  if (!token) return null;

  const coords = neighborhoodsWithMapCoords(neighborhoods);
  if (coords.length === 0) return null;

  const maxPins = options?.maxPins ?? 8;
  const pins = coords.slice(0, maxPins);
  const overlays = pins.map(
    (pin, index) =>
      `pin-s+${NEIGHBORHOODS_DESKTOP_MAP_PIN_COLORS[index % NEIGHBORHOODS_DESKTOP_MAP_PIN_COLORS.length]}(${pin.longitude},${pin.latitude})`,
  );

  const width = options?.width ?? 640;
  const height = options?.height ?? 280;

  if (pins.length === 1) {
    const only = pins[0]!;
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${overlays[0]}/${only.longitude},${only.latitude},12,0/${width}x${height}@2x?access_token=${encodeURIComponent(token)}`;
  }

  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${overlays.join(",")}/auto/${width}x${height}@2x?padding=48&access_token=${encodeURIComponent(token)}`;
}

/** Re-export pour les tests / tags ambiance dérivés des moods portail. */
export type { NeighborhoodPortalMood };
