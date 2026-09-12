import type { NeighborhoodDetail } from "@yunicity/types";

import {
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_GREEN,
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_GREEN_HINT,
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_HERITAGE,
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_HERITAGE_HINT,
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_LOCAL,
  NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_LOCAL_HINT,
  NEIGHBORHOOD_DETAIL_MEDIUM_TAB_EVENTS,
  NEIGHBORHOOD_DETAIL_MEDIUM_TAB_FEED,
  NEIGHBORHOOD_DETAIL_MEDIUM_TAB_OVERVIEW,
  NEIGHBORHOOD_DETAIL_MEDIUM_TAB_PLACES,
  NEIGHBORHOOD_DETAIL_MEDIUM_TAB_PRACTICAL,
} from "./neighborhood-detail-medium-labels";
import {
  buildNeighborhoodDetailDesktopAmbianceLine,
  buildNeighborhoodDetailDesktopFeedItems,
  buildNeighborhoodDetailDesktopGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage,
  buildNeighborhoodDetailDesktopHeroCredit,
  buildNeighborhoodDetailDesktopIdentityBody,
  buildNeighborhoodDetailDesktopListHref,
  buildNeighborhoodDetailDesktopMapHref,
  buildNeighborhoodDetailDesktopNowItems,
  buildNeighborhoodDetailDesktopPhotoCount,
  buildNeighborhoodDetailDesktopPlaceCards,
  buildNeighborhoodDetailDesktopSectorHint,
  buildNeighborhoodDetailDesktopSelfHref,
  buildNeighborhoodDetailDesktopTagline,
  buildNeighborhoodDetailDesktopTags,
  buildNeighborhoodDetailDesktopTodayEvents,
  type NeighborhoodDetailDesktopEventCard,
  type NeighborhoodDetailDesktopFeedItem,
  type NeighborhoodDetailDesktopNowItem,
  type NeighborhoodDetailDesktopPlaceCard,
  type NeighborhoodDetailDesktopTag,
} from "./neighborhood-detail-desktop-presenter";

export type NeighborhoodDetailMediumTabId =
  | "overview"
  | "feed"
  | "places"
  | "events"
  | "practical";

export type NeighborhoodDetailMediumTab = {
  id: NeighborhoodDetailMediumTabId;
  label: string;
  anchor: string;
};

export type NeighborhoodDetailMediumPillar = {
  id: string;
  label: string;
  description: string;
  tone: "purple" | "peach" | "green";
};

export const NEIGHBORHOOD_DETAIL_MEDIUM_TABS: NeighborhoodDetailMediumTab[] = [
  { id: "overview", label: NEIGHBORHOOD_DETAIL_MEDIUM_TAB_OVERVIEW, anchor: "#nd-medium-overview" },
  { id: "feed", label: NEIGHBORHOOD_DETAIL_MEDIUM_TAB_FEED, anchor: "#nd-medium-feed" },
  { id: "places", label: NEIGHBORHOOD_DETAIL_MEDIUM_TAB_PLACES, anchor: "#nd-medium-places" },
  { id: "events", label: NEIGHBORHOOD_DETAIL_MEDIUM_TAB_EVENTS, anchor: "#nd-medium-events" },
  {
    id: "practical",
    label: NEIGHBORHOOD_DETAIL_MEDIUM_TAB_PRACTICAL,
    anchor: "#nd-medium-practical",
  },
];

function trimHint(value: string | null | undefined, fallback: string, max = 48): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= max) return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function buildNeighborhoodDetailMediumPillars(
  detail: NeighborhoodDetail,
): NeighborhoodDetailMediumPillar[] {
  const landmark = detail.landmarks?.[0]?.name?.trim();
  return [
    {
      id: "heritage",
      label: NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_HERITAGE,
      description: landmark
        ? trimHint(`${landmark}, musées`, NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_HERITAGE_HINT)
        : NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_HERITAGE_HINT,
      tone: "purple",
    },
    {
      id: "local",
      label: NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_LOCAL,
      description: trimHint(detail.local_life, NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_LOCAL_HINT),
      tone: "peach",
    },
    {
      id: "green",
      label: NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_GREEN,
      description: trimHint(detail.green_spaces, NEIGHBORHOOD_DETAIL_MEDIUM_PILLAR_GREEN_HINT),
      tone: "green",
    },
  ];
}

export {
  buildNeighborhoodDetailDesktopAmbianceLine as buildNeighborhoodDetailMediumAmbianceLine,
  buildNeighborhoodDetailDesktopFeedItems as buildNeighborhoodDetailMediumFeedItems,
  buildNeighborhoodDetailDesktopGalleryUrls as buildNeighborhoodDetailMediumGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage as buildNeighborhoodDetailMediumHeroImage,
  buildNeighborhoodDetailDesktopHeroCredit as buildNeighborhoodDetailMediumHeroCredit,
  buildNeighborhoodDetailDesktopIdentityBody as buildNeighborhoodDetailMediumIdentityBody,
  buildNeighborhoodDetailDesktopListHref as buildNeighborhoodDetailMediumListHref,
  buildNeighborhoodDetailDesktopMapHref as buildNeighborhoodDetailMediumMapHref,
  buildNeighborhoodDetailDesktopNowItems as buildNeighborhoodDetailMediumNowItems,
  buildNeighborhoodDetailDesktopPhotoCount as buildNeighborhoodDetailMediumPhotoCount,
  buildNeighborhoodDetailDesktopPlaceCards as buildNeighborhoodDetailMediumPlaceCards,
  buildNeighborhoodDetailDesktopSectorHint as buildNeighborhoodDetailMediumSectorHint,
  buildNeighborhoodDetailDesktopSelfHref as buildNeighborhoodDetailMediumSelfHref,
  buildNeighborhoodDetailDesktopTagline as buildNeighborhoodDetailMediumTagline,
  buildNeighborhoodDetailDesktopTags as buildNeighborhoodDetailMediumTags,
  buildNeighborhoodDetailDesktopTodayEvents as buildNeighborhoodDetailMediumTodayEvents,
  type NeighborhoodDetailDesktopEventCard as NeighborhoodDetailMediumEventCard,
  type NeighborhoodDetailDesktopFeedItem as NeighborhoodDetailMediumFeedItem,
  type NeighborhoodDetailDesktopNowItem as NeighborhoodDetailMediumNowItem,
  type NeighborhoodDetailDesktopPlaceCard as NeighborhoodDetailMediumPlaceCard,
  type NeighborhoodDetailDesktopTag as NeighborhoodDetailMediumTag,
};
