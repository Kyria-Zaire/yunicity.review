import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { eventTypeLabel } from "./event-labels";
import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import { resolveCulturalPlaceImageOverride } from "./event-hero-image";
import { buildMapPlaceUrl } from "./explorer-links";
import {
  buildSortirLiveEventCards,
  buildSortirLivePlaceCards,
  type SortirCategoryId,
  type SortirLiveEventCard,
  type SortirLivePlaceCard,
} from "./sortir-portal";

/** Catégories pills mobile Sortir (MOBILE-SORTIR-01). */
export type SortirMobileCategoryId =
  | "all"
  | "concerts"
  | "parties"
  | "expos"
  | "sport"
  | "other";

export function mapSortirMobileCategoryToPortal(
  category: SortirMobileCategoryId,
): SortirCategoryId {
  switch (category) {
    case "concerts":
      return "concerts";
    case "parties":
      return "sortir";
    case "expos":
      return "culture";
    case "sport":
      return "rencontres";
    case "other":
      return "cafe";
    default:
      return "";
  }
}

export type SortirMobileUpcomingRow = SortirLiveEventCard & {
  startsAt: string;
  weekdayLabel: string;
  dayNumber: string;
  monthLabel: string;
  categoryLabel: string;
  locationDetail: string;
};

export function formatSortirMobileDateParts(iso: string): {
  weekdayLabel: string;
  dayNumber: string;
  monthLabel: string;
} {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { weekdayLabel: "—", dayNumber: "—", monthLabel: "" };
  }
  return {
    weekdayLabel: date
      .toLocaleDateString("fr-FR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase(),
    dayNumber: String(date.getDate()),
    monthLabel: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

export function buildSortirMobileUpcomingRows(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  categoryId?: SortirCategoryId;
  maxItems?: number;
}): SortirMobileUpcomingRow[] {
  const cards = buildSortirLiveEventCards(input);
  const eventsById = new Map(input.events.map((event) => [event.id, event]));

  return cards.map((card) => {
    const event = eventsById.get(card.id);
    const parts = formatSortirMobileDateParts(event?.starts_at ?? "");
    const categoryLabel = eventTypeLabel(event?.event_type ?? null) ?? "Sortie";
    const locationDetail = event
      ? `${event.location_name?.trim() || event.district?.trim() || input.city}${
          event.neighborhood_summary?.display_name
            ? ` • ${event.neighborhood_summary.display_name}`
            : ""
        }`
      : card.locationLine;

    return {
      ...card,
      startsAt: event?.starts_at ?? "",
      weekdayLabel: parts.weekdayLabel,
      dayNumber: parts.dayNumber,
      monthLabel: parts.monthLabel,
      categoryLabel,
      locationDetail,
    };
  });
}

export function filterSortirLiveEventCardsByQuery(
  items: SortirLiveEventCard[],
  query: string,
): SortirLiveEventCard[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(trimmed) ||
      item.subtitle.toLowerCase().includes(trimmed) ||
      item.locationLine.toLowerCase().includes(trimmed),
  );
}

export function buildSortirMobilePopularPlaceCards(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): SortirLivePlaceCard[] {
  const live = buildSortirLivePlaceCards({ ...input, maxItems: input.maxItems ?? 8 });
  if (live.length > 0) return live;

  const city = input.city.trim() || "Reims";
  return input.culturalPlaces
    .filter((place) => place.is_featured)
    .slice(0, input.maxItems ?? 8)
    .map((place) => ({
      id: place.id,
      name: place.name,
      subtitle:
        place.editorial_excerpt?.trim() ||
        place.short_description?.trim() ||
        culturalPlaceCategoryLabel(place.category),
      moodLabel: culturalPlaceCategoryLabel(place.category),
      moodTone: "culture" as const,
      imageUrl: resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place),
      href: buildMapPlaceUrl(place.slug, { city }),
      tonightEventCount: 0,
    }));
}

export function sortirMobileCategoryBadgeClass(
  tone: SortirLiveEventCard["badgeTone"],
): string {
  switch (tone) {
    case "concert":
      return "bg-[#F3EEFF] text-[#7C3AED]";
    case "tasting":
      return "bg-[#FFF0F6] text-[#DB2777]";
    case "exhibition":
      return "bg-[#EFF6FF] text-[#2563EB]";
    default:
      return "bg-[#ECFDF5] text-[#059669]";
  }
}

export function sortirMobileDateColumnClass(
  tone: SortirLiveEventCard["badgeTone"],
): string {
  switch (tone) {
    case "concert":
      return "text-[#7C3AED]";
    case "tasting":
      return "text-[#DB2777]";
    case "exhibition":
      return "text-[#2563EB]";
    default:
      return "text-[#059669]";
  }
}
