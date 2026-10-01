import type { CulturalPlaceDetail, CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import { culturalPlaceCategoryLabel, culturalPlaceLocationLine } from "./cultural-place-labels";
import {
  isUnreliableCulturalImageUrl,
  resolveCulturalPlaceDisplayUrl,
} from "./cultural-place-display-image";
import { usableCulturalGalleryImages } from "./cultural-place-media";
import {
  eventDesktopSimilarBadgeLabel,
  eventDesktopSimilarBadgeTone,
  splitEventAboutText,
} from "./event-detail-desktop";
import { resolveEventVenuePlace } from "./event-detail-portal";
import { resolveFeaturedCarouselEventImage } from "./event-hero-image";
import { filterAgendaUpcomingEvents, formatEventClockTime } from "./events-agenda";
import { buildMapPlaceUrl } from "./explorer-links";
import { haversineMeters } from "./map-portal";
import {
  PLACE_DETAIL_DESKTOP_BREADCRUMB_MAP,
  PLACE_DETAIL_DESKTOP_BREADCRUMB_PLACES,
  PLACE_DETAIL_DESKTOP_HOURS_EMPTY,
} from "./place-detail-desktop-labels";
import { buildPlaceMobileDetailAboutText } from "./place-detail-mobile-presenter";
import { buildPublicPlaceHref } from "./place-routing";
import { placesCategoryBadgeTone } from "./places-portal";

const EVENT_BADGE_TONE_CLASS: Record<ReturnType<typeof eventDesktopSimilarBadgeTone>, string> = {
  culture: "bg-blue-100 text-blue-700",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-700",
};

export type PlaceDetailDesktopTabId = "overview" | "practical" | "events" | "publications";

export type PlaceDetailDesktopBreadcrumb = {
  label: string;
  href?: string;
};

export type PlaceDetailDesktopBadge = {
  label: string;
  tone: string;
};

export type PlaceDetailDesktopKnowItem = {
  id: string;
  label: string;
  sublabel: string;
  tone: string;
};

export type PlaceDetailDesktopWhyItem = {
  id: string;
  title: string;
  body: string;
  tone: string;
};

export type PlaceDetailDesktopHourRow = {
  day: string;
  hours: string;
};

export type PlaceDetailDesktopEventCard = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  badgeLabel: string;
  badgeTone: string;
  metaLine: string;
};

export type PlaceDetailDesktopNearbyCard = {
  id: string;
  title: string;
  href: string;
  mapHref: string;
  imageUrl: string | null;
  categoryBadge: string;
  categoryTone: string;
  locationLine: string;
};

const HERITAGE_CATEGORIES = new Set(["library", "monument", "cathedral", "heritage", "museum"]);

export function buildPlaceDetailDesktopBreadcrumbs(
  place: CulturalPlaceDetail,
): PlaceDetailDesktopBreadcrumb[] {
  return [
    { label: PLACE_DETAIL_DESKTOP_BREADCRUMB_MAP, href: `/map?city=${encodeURIComponent(place.city)}` },
    { label: PLACE_DETAIL_DESKTOP_BREADCRUMB_PLACES, href: `/places?city=${encodeURIComponent(place.city)}` },
    { label: place.name },
  ];
}

export function buildPlaceDetailDesktopGalleryUrls(place: CulturalPlaceDetail): string[] {
  const candidates: string[] = [];
  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && !candidates.includes(trimmed)) candidates.push(trimmed);
  };

  for (const image of usableCulturalGalleryImages(place.gallery_images)) {
    push(image.url);
  }
  push(resolveCulturalPlaceDisplayUrl(place, "hero"));
  push(resolveCulturalPlaceDisplayUrl(place, "thumbnail"));
  push(place.image_url);

  const reliable = candidates.filter((url) => !isUnreliableCulturalImageUrl(url));
  const unreliable = candidates.filter((url) => isUnreliableCulturalImageUrl(url));
  return reliable.length > 0 ? [...reliable, ...unreliable] : candidates;
}

export function buildPlaceDetailDesktopBadges(place: CulturalPlaceDetail): PlaceDetailDesktopBadge[] {
  const badges: PlaceDetailDesktopBadge[] = [
    {
      label: culturalPlaceCategoryLabel(place.category).toUpperCase(),
      tone: placesCategoryBadgeTone(place.category),
    },
  ];

  if (HERITAGE_CATEGORIES.has(place.category)) {
    badges.push({ label: "PATRIMOINE", tone: "bg-violet-50 text-violet-800" });
  }

  return badges;
}

export function splitPlaceDesktopCopy(place: CulturalPlaceDetail): {
  subtitle: string;
  preview: string;
  rest: string | null;
} {
  const text =
    place.short_description?.trim() ||
    place.editorial_excerpt?.trim() ||
    buildPlaceMobileDetailAboutText(place) ||
    "";
  if (!text) return { subtitle: "", preview: "", rest: null };

  const newline = text.indexOf("\n");
  let firstLine = text;
  if (newline >= 0) {
    firstLine = text.slice(0, newline).trim();
  } else {
    const sentenceEnd = text.search(/\.\s/);
    if (sentenceEnd > 20) firstLine = text.slice(0, sentenceEnd + 1).trim();
  }

  const subtitle =
    firstLine.length > 120 ? `${firstLine.slice(0, 117).trimEnd()}…` : firstLine;
  const body = newline >= 0 ? text.slice(newline + 1).trim() : text;
  const about = splitEventAboutText(body || text);
  return { subtitle, preview: about.preview, rest: about.rest };
}

export function buildPlaceDetailDesktopKnowItems(place: CulturalPlaceDetail): PlaceDetailDesktopKnowItem[] {
  const items: PlaceDetailDesktopKnowItem[] = [
    {
      id: "free",
      label: "Entrée libre",
      sublabel: "Accès public",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      id: "pmr",
      label: "Accessible PMR",
      sublabel: "Accès adapté",
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  if (["library", "museum"].includes(place.category)) {
    items.push({
      id: "quiet",
      label: "Espace calme",
      sublabel: "Lecture & travail",
      tone: "bg-violet-50 text-violet-700",
    });
  }

  if (["library", "museum", "heritage", "monument"].includes(place.category)) {
    items.push({
      id: "docs",
      label: "Documentation",
      sublabel: "Sur place",
      tone: "bg-orange-50 text-orange-700",
    });
  }

  return items.slice(0, 4);
}

export function buildPlaceDetailDesktopWhyItems(place: CulturalPlaceDetail): PlaceDetailDesktopWhyItem[] {
  const category = place.category;
  const items: PlaceDetailDesktopWhyItem[] = [];

  if (["library", "museum", "heritage", "monument", "cathedral"].includes(category)) {
    items.push({
      id: "heritage",
      title: category === "library" ? "Architecture Art déco" : "Architecture remarquable",
      body: "Un patrimoine local à découvrir sur place.",
      tone: "bg-violet-100 text-violet-700",
    });
  }

  if (["library", "museum"].includes(category)) {
    items.push({
      id: "read",
      title: "Lire et travailler",
      body: "Un lieu calme pour s'arrêter au cœur de la ville.",
      tone: "bg-emerald-100 text-emerald-700",
    });
  }

  items.push({
    id: "local",
    title: category === "library" ? "Patrimoine rémois" : "Utile au quotidien",
    body: culturalPlaceLocationLine(place),
    tone: "bg-orange-100 text-orange-700",
  });

  return items.slice(0, 3);
}

export function buildPlaceDetailDesktopHourRows(_place: CulturalPlaceDetail): PlaceDetailDesktopHourRow[] {
  return [];
}

export function placeDetailDesktopHoursEmptyMessage(_place: CulturalPlaceDetail): string {
  return PLACE_DETAIL_DESKTOP_HOURS_EMPTY;
}

export function buildPlaceDetailDesktopMapHref(place: CulturalPlaceDetail, route = false): string {
  return buildMapPlaceUrl(place.slug, { city: place.city, route });
}

export function buildPlaceDetailDesktopSharePath(place: CulturalPlaceDetail): string {
  return buildPublicPlaceHref(place.slug, place.city);
}

export function placeDetailDesktopIsVerified(place: CulturalPlaceDetail): boolean {
  return Boolean(place.source_name?.trim() || place.source_url?.trim());
}

function eventMatchesPlace(
  event: LocalEvent,
  place: CulturalPlaceDetail,
  allPlaces: CulturalPlaceListItem[],
): boolean {
  const pool = allPlaces.length > 0 ? allPlaces : [place];
  const venue = resolveEventVenuePlace(event, pool);
  if (venue?.id === place.id) {
    return true;
  }

  const locationNeedle = event.location_name.trim().toLowerCase();
  const placeName = place.name.trim().toLowerCase();
  if (!locationNeedle || !placeName) {
    return false;
  }

  return (
    locationNeedle === placeName ||
    locationNeedle.includes(placeName) ||
    placeName.includes(locationNeedle)
  );
}

export function pickPlaceDetailDesktopEvents(
  place: CulturalPlaceDetail,
  candidates: LocalEvent[],
  allPlaces: CulturalPlaceListItem[],
  maxItems = 2,
): LocalEvent[] {
  return filterAgendaUpcomingEvents(candidates)
    .filter((event) => !event.is_cancelled && eventMatchesPlace(event, place, allPlaces))
    .slice(0, maxItems);
}

export function pickPlaceDetailDesktopNearbyPlaces(
  place: CulturalPlaceDetail,
  places: CulturalPlaceListItem[],
  maxItems = 3,
): CulturalPlaceListItem[] {
  return places
    .filter((candidate) => candidate.id !== place.id)
    .map((candidate) => ({
      candidate,
      distance: haversineMeters(
        place.latitude,
        place.longitude,
        candidate.latitude,
        candidate.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxItems)
    .map(({ candidate }) => candidate);
}

export function buildPlaceDetailDesktopEventCards(input: {
  place: CulturalPlaceDetail;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): PlaceDetailDesktopEventCard[] {
  const { place, events, culturalPlaces, maxItems = 2 } = input;
  return pickPlaceDetailDesktopEvents(place, events, culturalPlaces, maxItems).map((event) => {
    const badgeToneKey = eventDesktopSimilarBadgeTone(event.event_type);
    const metaParts = [
      formatEventClockTime(event.starts_at),
      event.district?.trim() || event.location_name.trim(),
    ].filter(Boolean);

    return {
      id: event.id,
      title: event.title,
      href: `/events/${event.id}`,
      imageUrl: resolveFeaturedCarouselEventImage(event),
      badgeLabel: eventDesktopSimilarBadgeLabel(event.event_type),
      badgeTone: EVENT_BADGE_TONE_CLASS[badgeToneKey],
      metaLine: metaParts.join(" · "),
    };
  });
}

export function buildPlaceDetailDesktopNearbyCards(input: {
  place: CulturalPlaceDetail;
  places: CulturalPlaceListItem[];
  maxItems?: number;
}): PlaceDetailDesktopNearbyCard[] {
  const { place, places, maxItems = 3 } = input;
  const city = place.city.trim() || "Reims";

  return pickPlaceDetailDesktopNearbyPlaces(place, places, maxItems).map((candidate) => ({
    id: candidate.id,
    title: candidate.name,
    href: buildPublicPlaceHref(candidate.slug, city),
    mapHref: buildMapPlaceUrl(candidate.slug, { city }),
    imageUrl: resolveCulturalPlaceDisplayUrl(candidate, "thumbnail"),
    categoryBadge: culturalPlaceCategoryLabel(candidate.category).toUpperCase(),
    categoryTone: placesCategoryBadgeTone(candidate.category),
    locationLine: culturalPlaceLocationLine(candidate),
  }));
}
