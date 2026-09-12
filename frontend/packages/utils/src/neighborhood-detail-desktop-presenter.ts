import type { NeighborhoodDetail, NeighborhoodDetailEventItem, NeighborhoodDetailPlaceItem } from "@yunicity/types";

import { buildMapNeighborhoodUrl, buildMapPlaceUrl } from "./explorer-links";
import { neighborhoodHeroTagline } from "./neighborhood-detail";
import { neighborhoodAmbianceLabel, neighborhoodHref } from "./neighborhood-labels";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_GREEN,
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_GREEN_HINT,
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_HERITAGE,
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_HERITAGE_HINT,
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_LOCAL,
  NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_LOCAL_HINT,
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_EVENTS,
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_FEED,
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_OVERVIEW,
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PLACES,
  NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PRACTICAL,
} from "./neighborhood-detail-desktop-labels";
import {
  resolveNeighborhoodEditorialImage,
  type EditorialImageCredit,
} from "./editorial-fallback-images";
import { isPendingYunicityHostedCoverUrl } from "./map-media-url";
import { resolveNeighborhoodV2HeroQuote } from "./neighborhood-v2-presenter";
import {
  resolveNeighborhoodsDesktopImage,
  resolveNeighborhoodsDesktopImageCredit,
} from "./neighborhoods-desktop-presenter";
import { buildPublicPlaceHref } from "./place-routing";

export type NeighborhoodDetailDesktopTabId =
  | "overview"
  | "feed"
  | "places"
  | "events"
  | "practical";

export type NeighborhoodDetailDesktopTab = {
  id: NeighborhoodDetailDesktopTabId;
  label: string;
  anchor: string;
};

export type NeighborhoodDetailDesktopTag = {
  id: string;
  label: string;
  tone: "purple" | "blue" | "green" | "peach" | "indigo" | "slate";
};

export type NeighborhoodDetailDesktopEventCard = {
  id: string;
  title: string;
  whenLabel: string;
  imageUrl: string | null;
  href: string;
  categoryLabel: string | null;
};

export type NeighborhoodDetailDesktopPlaceCard = {
  id: string;
  name: string;
  categoryLabel: string;
  imageUrl: string | null;
  href: string;
  mapHref: string;
};

export type NeighborhoodDetailDesktopFeedItem = {
  id: string;
  body: string;
  imageUrl: string | null;
  href: string;
};

export type NeighborhoodDetailDesktopNowItem = {
  id: string;
  title: string;
  whenLabel: string;
  href: string;
};

export type NeighborhoodDetailDesktopPillar = {
  id: string;
  label: string;
  description: string;
  tone: "purple" | "peach" | "green";
};

export const NEIGHBORHOOD_DETAIL_DESKTOP_TABS: NeighborhoodDetailDesktopTab[] = [
  { id: "overview", label: NEIGHBORHOOD_DETAIL_DESKTOP_TAB_OVERVIEW, anchor: "#nd-desktop-overview" },
  { id: "feed", label: NEIGHBORHOOD_DETAIL_DESKTOP_TAB_FEED, anchor: "#nd-desktop-feed" },
  { id: "places", label: NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PLACES, anchor: "#nd-desktop-places" },
  { id: "events", label: NEIGHBORHOOD_DETAIL_DESKTOP_TAB_EVENTS, anchor: "#nd-desktop-events" },
  { id: "practical", label: NEIGHBORHOOD_DETAIL_DESKTOP_TAB_PRACTICAL, anchor: "#nd-desktop-practical" },
];

function trimPillarHint(value: string | null | undefined, fallback: string, max = 48): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= max) return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function buildNeighborhoodDetailDesktopPillars(
  detail: NeighborhoodDetail,
): NeighborhoodDetailDesktopPillar[] {
  const landmark = detail.landmarks?.[0]?.name?.trim();
  return [
    {
      id: "heritage",
      label: NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_HERITAGE,
      description: landmark
        ? trimPillarHint(`${landmark}, musées`, NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_HERITAGE_HINT)
        : NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_HERITAGE_HINT,
      tone: "purple",
    },
    {
      id: "local",
      label: NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_LOCAL,
      description: trimPillarHint(detail.local_life, NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_LOCAL_HINT),
      tone: "peach",
    },
    {
      id: "green",
      label: NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_GREEN,
      description: trimPillarHint(detail.green_spaces, NEIGHBORHOOD_DETAIL_DESKTOP_PILLAR_GREEN_HINT),
      tone: "green",
    },
  ];
}

function formatWhenLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return `Aujourd’hui • ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
  if (isTomorrow) return `Demain • ${time}`;
  const day = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const capitalized = day.charAt(0).toUpperCase() + day.slice(1);
  return `${capitalized} • ${time}`;
}

function moodTone(mood: string): NeighborhoodDetailDesktopTag["tone"] {
  const key = mood.trim().toLowerCase();
  if (key.includes("heritage") || key.includes("culturel") || key.includes("cultural")) return "purple";
  if (key.includes("calm") || key.includes("paisible") || key.includes("green")) return "green";
  if (key.includes("festive") || key.includes("gourmet") || key.includes("lively")) return "peach";
  if (key.includes("family") || key.includes("student")) return "blue";
  return "indigo";
}

function moodLabel(mood: string): string {
  const key = mood.trim().toLowerCase();
  const map: Record<string, string> = {
    heritage: "Patrimoine",
    cultural: "Culturel",
    culture: "Culturel",
    calm: "Paisible",
    green: "Vert",
    festive: "Vivant",
    gourmet: "Food",
    family: "Familial",
    student: "Étudiant",
    creative: "Créatif",
  };
  return map[key] ?? mood.charAt(0).toUpperCase() + mood.slice(1);
}

export function buildNeighborhoodDetailDesktopTags(
  detail: NeighborhoodDetail,
): NeighborhoodDetailDesktopTag[] {
  const moods = detail.hero?.moods?.length ? detail.hero.moods : detail.moods ?? [];
  if (moods.length > 0) {
    return moods.slice(0, 3).map((mood) => ({
      id: mood,
      label: moodLabel(mood),
      tone: moodTone(mood),
    }));
  }
  const ambiance = detail.ambiance?.trim();
  if (ambiance) {
    return [
      {
        id: ambiance,
        label: neighborhoodAmbianceLabel(ambiance) ?? ambiance,
        tone: moodTone(ambiance),
      },
    ];
  }
  return [];
}

export function buildNeighborhoodDetailDesktopTagline(detail: NeighborhoodDetail): string {
  return (
    resolveNeighborhoodV2HeroQuote(detail)?.trim() ||
    detail.short_description?.trim() ||
    neighborhoodHeroTagline(detail)
  );
}

export function buildNeighborhoodDetailDesktopIdentityBody(detail: NeighborhoodDetail): string {
  const story = detail.history?.long_story?.trim();
  if (story) return story;
  return (
    detail.short_description?.trim() ||
    "Ce quartier se découvre au fil de la marche — patrimoine, vies locales et espaces de rencontre."
  );
}

export function buildNeighborhoodDetailDesktopHeroImage(detail: NeighborhoodDetail): string | null {
  // Même règle que la liste quartiers : Wikimedia par slug, jamais les hero.jpg
  // pending (1×1 / 404) que l’API seed encore dans cover_image_url.
  return resolveNeighborhoodsDesktopImage({
    slug: detail.slug,
    cover_image_url: detail.cover_image_url,
  });
}

/** Attribution de l'image hero — partagée par desktop, medium et mobile. */
export function buildNeighborhoodDetailDesktopHeroCredit(
  detail: NeighborhoodDetail,
): EditorialImageCredit | null {
  return resolveNeighborhoodsDesktopImageCredit({ slug: detail.slug });
}

export function buildNeighborhoodDetailDesktopGalleryUrls(detail: NeighborhoodDetail): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed) || isPendingYunicityHostedCoverUrl(trimmed)) return;
    seen.add(trimmed);
    urls.push(trimmed);
  };

  push(buildNeighborhoodDetailDesktopHeroImage(detail));
  for (const place of detail.places ?? []) push(place.image_url);
  for (const event of detail.events ?? []) push(event.cover_image_url);
  return urls;
}

export function buildNeighborhoodDetailDesktopPhotoCount(detail: NeighborhoodDetail): number {
  return Math.max(buildNeighborhoodDetailDesktopGalleryUrls(detail).length, 0);
}

function mapEventCard(
  event: NeighborhoodDetailEventItem,
  city: string,
  now = new Date(),
): NeighborhoodDetailDesktopEventCard {
  return {
    id: event.id,
    title: event.title,
    whenLabel: formatWhenLabel(event.starts_at, now),
    imageUrl: event.cover_image_url,
    href: `/events/${event.id}?city=${encodeURIComponent(city)}`,
    categoryLabel: null,
  };
}

export function buildNeighborhoodDetailDesktopTodayEvents(
  detail: NeighborhoodDetail,
  now = new Date(),
): { featured: NeighborhoodDetailDesktopEventCard | null; secondary: NeighborhoodDetailDesktopEventCard[] } {
  const city = detail.city.trim() || "Reims";
  const upcoming = [...(detail.events ?? [])]
    .filter((event) => !Number.isNaN(new Date(event.starts_at).getTime()))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  if (upcoming.length === 0) {
    return { featured: null, secondary: [] };
  }

  const [first, ...rest] = upcoming;
  return {
    featured: mapEventCard(first!, city, now),
    secondary: rest.slice(0, 2).map((event) => mapEventCard(event, city, now)),
  };
}

export function buildNeighborhoodDetailDesktopPlaceCards(
  detail: NeighborhoodDetail,
  maxItems = 6,
): NeighborhoodDetailDesktopPlaceCard[] {
  const city = detail.city.trim() || "Reims";
  return (detail.places ?? []).slice(0, maxItems).map((place: NeighborhoodDetailPlaceItem) => ({
    id: place.id,
    name: place.name,
    categoryLabel: place.category?.trim() || "Lieu",
    imageUrl: place.image_url,
    href: buildPublicPlaceHref(place.slug, city),
    mapHref: buildMapPlaceUrl(place.slug, { city }),
  }));
}

export function buildNeighborhoodDetailDesktopFeedItems(
  detail: NeighborhoodDetail,
  maxItems = 4,
): NeighborhoodDetailDesktopFeedItem[] {
  const city = detail.city.trim() || "Reims";
  const editorial = resolveNeighborhoodEditorialImage({
    slug: detail.slug,
    cover_image_url: null,
  });
  return (detail.contributions ?? []).slice(0, maxItems).map((item) => ({
    id: item.id,
    body: item.title?.trim() || item.body.trim(),
    imageUrl: editorial,
    href: `/feed?city=${encodeURIComponent(city)}&neighborhood=${encodeURIComponent(detail.slug)}`,
  }));
}

export function buildNeighborhoodDetailDesktopNowItems(
  detail: NeighborhoodDetail,
  maxItems = 3,
  now = new Date(),
): NeighborhoodDetailDesktopNowItem[] {
  const city = detail.city.trim() || "Reims";
  return [...(detail.events ?? [])]
    .filter((event) => !Number.isNaN(new Date(event.starts_at).getTime()))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, maxItems)
    .map((event) => ({
      id: event.id,
      title: event.title,
      whenLabel: formatWhenLabel(event.starts_at, now),
      href: `/events/${event.id}?city=${encodeURIComponent(city)}`,
    }));
}

export function buildNeighborhoodDetailDesktopAmbianceLine(detail: NeighborhoodDetail): string {
  const tags = buildNeighborhoodDetailDesktopTags(detail).map((tag) => tag.label.toLowerCase());
  if (tags.length >= 2) return `${tags[0]} et ${tags[1]}`;
  if (tags.length === 1) return tags[0]!;
  const ambiance = detail.ambiance?.trim();
  if (ambiance) return (neighborhoodAmbianceLabel(ambiance) ?? ambiance).toLowerCase();
  return "locale";
}

export function buildNeighborhoodDetailDesktopSectorHint(detail: NeighborhoodDetail): string {
  // Hint éditorial soft — pas de géocoding inventé.
  return "secteur local";
}

export function buildNeighborhoodDetailDesktopMapHref(detail: NeighborhoodDetail): string {
  return buildMapNeighborhoodUrl(detail.slug, { city: detail.city });
}

export function buildNeighborhoodDetailDesktopListHref(detail: NeighborhoodDetail): string {
  return `/neighborhoods?city=${encodeURIComponent(detail.city.trim() || "Reims")}`;
}

export function buildNeighborhoodDetailDesktopSelfHref(detail: NeighborhoodDetail): string {
  return neighborhoodHref(detail.slug, detail.city);
}
