import type { NeighborhoodDetail } from "@yunicity/types";

import {
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_GREEN,
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_GREEN_HINT,
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_HERITAGE,
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_HERITAGE_HINT,
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_LOCAL,
  NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_LOCAL_HINT,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_EVENTS,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_FEED,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_OVERVIEW,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_PLACES,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_PRACTICAL,
} from "./neighborhood-detail-mobile-labels";
import {
  buildNeighborhoodDetailDesktopAmbianceLine,
  buildNeighborhoodDetailDesktopFeedItems,
  buildNeighborhoodDetailDesktopGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage,
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

export type NeighborhoodDetailMobileTabId =
  | "overview"
  | "feed"
  | "places"
  | "events"
  | "practical";

export type NeighborhoodDetailMobileTab = {
  id: NeighborhoodDetailMobileTabId;
  label: string;
  anchor: string;
};

export type NeighborhoodDetailMobilePillar = {
  id: string;
  label: string;
  description: string;
  tone: "purple" | "peach" | "green";
};

export const NEIGHBORHOOD_DETAIL_MOBILE_TABS: NeighborhoodDetailMobileTab[] = [
  { id: "overview", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_OVERVIEW, anchor: "#nd-mobile-overview" },
  { id: "feed", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_FEED, anchor: "#nd-mobile-feed" },
  { id: "places", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_PLACES, anchor: "#nd-mobile-places" },
  { id: "events", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_EVENTS, anchor: "#nd-mobile-events" },
  {
    id: "practical",
    label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_PRACTICAL,
    anchor: "#nd-mobile-practical",
  },
];

function trimHint(value: string | null | undefined, fallback: string, max = 48): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= max) return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function buildNeighborhoodDetailMobilePillars(
  detail: NeighborhoodDetail,
): NeighborhoodDetailMobilePillar[] {
  const landmark = detail.landmarks?.[0]?.name?.trim();
  return [
    {
      id: "heritage",
      label: NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_HERITAGE,
      description: landmark
        ? trimHint(`${landmark}, musées`, NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_HERITAGE_HINT)
        : NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_HERITAGE_HINT,
      tone: "purple",
    },
    {
      id: "local",
      label: NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_LOCAL,
      description: trimHint(detail.local_life, NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_LOCAL_HINT),
      tone: "peach",
    },
    {
      id: "green",
      label: NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_GREEN,
      description: trimHint(detail.green_spaces, NEIGHBORHOOD_DETAIL_MOBILE_PILLAR_GREEN_HINT),
      tone: "green",
    },
  ];
}

export {
  buildNeighborhoodDetailDesktopAmbianceLine as buildNeighborhoodDetailMobileAmbianceLine,
  buildNeighborhoodDetailDesktopFeedItems as buildNeighborhoodDetailMobileFeedItems,
  buildNeighborhoodDetailDesktopGalleryUrls as buildNeighborhoodDetailMobileGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage as buildNeighborhoodDetailMobileHeroImage,
  buildNeighborhoodDetailDesktopIdentityBody as buildNeighborhoodDetailMobileIdentityBody,
  buildNeighborhoodDetailDesktopListHref as buildNeighborhoodDetailMobileListHref,
  buildNeighborhoodDetailDesktopMapHref as buildNeighborhoodDetailMobileMapHref,
  buildNeighborhoodDetailDesktopNowItems as buildNeighborhoodDetailMobileNowItems,
  buildNeighborhoodDetailDesktopPhotoCount as buildNeighborhoodDetailMobilePhotoCount,
  buildNeighborhoodDetailDesktopPlaceCards as buildNeighborhoodDetailMobilePlaceCards,
  buildNeighborhoodDetailDesktopSectorHint as buildNeighborhoodDetailMobileSectorHint,
  buildNeighborhoodDetailDesktopSelfHref as buildNeighborhoodDetailMobileSelfHref,
  buildNeighborhoodDetailDesktopTagline as buildNeighborhoodDetailMobileTagline,
  buildNeighborhoodDetailDesktopTags as buildNeighborhoodDetailMobileTags,
  buildNeighborhoodDetailDesktopTodayEvents as buildNeighborhoodDetailMobileTodayEvents,
  type NeighborhoodDetailDesktopEventCard as NeighborhoodDetailMobileEventCard,
  type NeighborhoodDetailDesktopFeedItem as NeighborhoodDetailMobileFeedItem,
  type NeighborhoodDetailDesktopNowItem as NeighborhoodDetailMobileNowItem,
  type NeighborhoodDetailDesktopPlaceCard as NeighborhoodDetailMobilePlaceCard,
  type NeighborhoodDetailDesktopTag as NeighborhoodDetailMobileTag,
};
