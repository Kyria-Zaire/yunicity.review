import type { FeedPost, Tribe } from "@yunicity/types";

import {
  TRIBE_DETAIL_MEDIUM_COMMUNITY_SUFFIX,
  TRIBE_DETAIL_MEDIUM_RULE_NO_SPAM,
  TRIBE_DETAIL_MEDIUM_RULE_PRIVACY,
  TRIBE_DETAIL_MEDIUM_RULE_RESPECT,
  TRIBE_DETAIL_MEDIUM_TAB_ABOUT,
  TRIBE_DETAIL_MEDIUM_TAB_DISCUSSIONS,
  TRIBE_DETAIL_MEDIUM_TAB_EVENTS,
  TRIBE_DETAIL_MEDIUM_TAB_MEMBERS,
  TRIBE_DETAIL_MEDIUM_TAB_OVERVIEW,
} from "./tribe-detail-medium-labels";
import {
  buildTribeDetailDesktopFeaturedCard,
  buildTribeDetailDesktopGalleryUrls,
  buildTribeDetailDesktopProjectUrls,
  type TribeDetailDesktopFeaturedCard,
  type TribeDetailDesktopRule,
  type TribeDetailDesktopTab,
  type TribeDetailDesktopTabId,
} from "./tribe-detail-desktop-presenter";
import { tribeCategoryLabel } from "./tribe-labels";

export type TribeDetailMediumTabId = TribeDetailDesktopTabId;
export type TribeDetailMediumTab = TribeDetailDesktopTab;
export type TribeDetailMediumFeaturedCard = TribeDetailDesktopFeaturedCard;
export type TribeDetailMediumRule = TribeDetailDesktopRule;

export const TRIBE_DETAIL_MEDIUM_TABS: TribeDetailMediumTab[] = [
  { id: "overview", label: TRIBE_DETAIL_MEDIUM_TAB_OVERVIEW, anchor: "#tribe-medium-overview" },
  { id: "discussions", label: TRIBE_DETAIL_MEDIUM_TAB_DISCUSSIONS, anchor: "#tribe-medium-discussions" },
  { id: "events", label: TRIBE_DETAIL_MEDIUM_TAB_EVENTS, anchor: "#tribe-medium-events" },
  { id: "members", label: TRIBE_DETAIL_MEDIUM_TAB_MEMBERS, anchor: "#tribe-medium-members" },
  { id: "about", label: TRIBE_DETAIL_MEDIUM_TAB_ABOUT, anchor: "#tribe-medium-about" },
];

export function buildTribeDetailMediumLocationMeta(tribe: Tribe): string {
  const category = tribeCategoryLabel(tribe.category);
  return `${tribe.city} · ${category || TRIBE_DETAIL_MEDIUM_COMMUNITY_SUFFIX}`;
}

export function buildTribeDetailMediumGalleryUrls(tribe: Tribe, posts: FeedPost[]): string[] {
  return buildTribeDetailDesktopGalleryUrls(tribe, posts);
}

export function buildTribeDetailMediumFeaturedCard(
  tribe: Tribe,
  posts: FeedPost[],
): TribeDetailMediumFeaturedCard {
  return buildTribeDetailDesktopFeaturedCard(tribe, posts);
}

export function buildTribeDetailMediumProjectUrls(posts: FeedPost[], maxItems = 6): string[] {
  return buildTribeDetailDesktopProjectUrls(posts, maxItems);
}

export function buildTribeDetailMediumEssentialRules(): TribeDetailMediumRule[] {
  return [
    { id: "respect", label: TRIBE_DETAIL_MEDIUM_RULE_RESPECT },
    { id: "no-spam", label: TRIBE_DETAIL_MEDIUM_RULE_NO_SPAM },
    { id: "privacy", label: TRIBE_DETAIL_MEDIUM_RULE_PRIVACY },
  ];
}
