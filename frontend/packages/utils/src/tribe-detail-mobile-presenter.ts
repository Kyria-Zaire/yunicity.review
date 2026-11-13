import type { FeedPost, Tribe } from "@yunicity/types";

import { formatProfileMobileStatCount } from "./profile-mobile-presenter";
import {
  TRIBE_DETAIL_MOBILE_COMMUNITY_SUFFIX,
  TRIBE_DETAIL_MOBILE_RULE_NO_SPAM,
  TRIBE_DETAIL_MOBILE_RULE_PRIVACY,
  TRIBE_DETAIL_MOBILE_RULE_RESPECT,
  TRIBE_DETAIL_MOBILE_STAT_CATEGORY,
  TRIBE_DETAIL_MOBILE_STAT_EVENTS,
  TRIBE_DETAIL_MOBILE_STAT_MEMBERS,
  TRIBE_DETAIL_MOBILE_STAT_POSTS,
  TRIBE_DETAIL_MOBILE_TAB_ABOUT,
  TRIBE_DETAIL_MOBILE_TAB_DISCUSSIONS,
  TRIBE_DETAIL_MOBILE_TAB_EVENTS,
  TRIBE_DETAIL_MOBILE_TAB_MEMBERS,
  TRIBE_DETAIL_MOBILE_TAB_OVERVIEW,
  TRIBE_DETAIL_MOBILE_TEAM_PREFIX,
  TRIBE_DETAIL_MOBILE_WELCOME_BODY,
  TRIBE_DETAIL_MOBILE_WELCOME_TITLE,
} from "./tribe-detail-mobile-labels";
import {
  buildTribeDetailDesktopFeaturedCard,
  buildTribeDetailDesktopProjectUrls,
  type TribeDetailDesktopFeaturedCard,
  type TribeDetailDesktopRule,
  type TribeDetailDesktopTab,
  type TribeDetailDesktopTabId,
} from "./tribe-detail-desktop-presenter";
import { tribeCategoryLabel } from "./tribe-labels";

export type TribeDetailMobileTabId = TribeDetailDesktopTabId;
export type TribeDetailMobileTab = TribeDetailDesktopTab;
export type TribeDetailMobileFeaturedCard = TribeDetailDesktopFeaturedCard;
export type TribeDetailMobileRule = TribeDetailDesktopRule;

export const TRIBE_DETAIL_MOBILE_TABS: TribeDetailMobileTab[] = [
  { id: "overview", label: TRIBE_DETAIL_MOBILE_TAB_OVERVIEW, anchor: "#tribe-mobile-overview" },
  { id: "discussions", label: TRIBE_DETAIL_MOBILE_TAB_DISCUSSIONS, anchor: "#tribe-mobile-discussions" },
  { id: "events", label: TRIBE_DETAIL_MOBILE_TAB_EVENTS, anchor: "#tribe-mobile-events" },
  { id: "members", label: TRIBE_DETAIL_MOBILE_TAB_MEMBERS, anchor: "#tribe-mobile-members" },
  { id: "about", label: TRIBE_DETAIL_MOBILE_TAB_ABOUT, anchor: "#tribe-mobile-about" },
];

/** @deprecated Utiliser TRIBE_DETAIL_MOBILE_TABS */
export const TRIBE_DETAIL_MOBILE_TAB_IDS = TRIBE_DETAIL_MOBILE_TABS.map((tab) => tab.id);

export function buildTribeDetailMobileLocationMeta(tribe: Tribe): string {
  const category = tribeCategoryLabel(tribe.category);
  return `${tribe.city} · ${category || TRIBE_DETAIL_MOBILE_COMMUNITY_SUFFIX}`;
}

export function buildTribeDetailMobileFeaturedCard(
  tribe: Tribe,
  posts: FeedPost[],
): TribeDetailMobileFeaturedCard {
  const card = buildTribeDetailDesktopFeaturedCard(tribe, posts);
  if (posts.length === 0) {
    return {
      ...card,
      title: `${TRIBE_DETAIL_MOBILE_WELCOME_TITLE} 👋`,
      body: tribe.description?.trim() || TRIBE_DETAIL_MOBILE_WELCOME_BODY,
      authorLabel: `${TRIBE_DETAIL_MOBILE_TEAM_PREFIX} ${tribe.name}`,
    };
  }
  return card;
}

export function buildTribeDetailMobileEssentialRules(): TribeDetailMobileRule[] {
  return [
    { id: "respect", label: TRIBE_DETAIL_MOBILE_RULE_RESPECT },
    { id: "no-spam", label: TRIBE_DETAIL_MOBILE_RULE_NO_SPAM },
    { id: "privacy", label: TRIBE_DETAIL_MOBILE_RULE_PRIVACY },
  ];
}

export function buildTribeDetailMobileProjectUrls(posts: FeedPost[], maxItems = 6): string[] {
  return buildTribeDetailDesktopProjectUrls(posts, maxItems);
}

export type TribeDetailMobileStatItem = {
  id: "members" | "posts" | "events" | "category";
  value: string;
  label: string;
};

export function buildTribeDetailMobileStats(input: {
  tribe: Tribe;
  eventsCount: number;
  postsCount: number | null;
}): TribeDetailMobileStatItem[] {
  const items: TribeDetailMobileStatItem[] = [
    {
      id: "members",
      value: formatProfileMobileStatCount(input.tribe.active_member_count),
      label: TRIBE_DETAIL_MOBILE_STAT_MEMBERS,
    },
    {
      id: "events",
      value: formatProfileMobileStatCount(input.eventsCount),
      label: TRIBE_DETAIL_MOBILE_STAT_EVENTS,
    },
  ];

  if (input.postsCount != null) {
    items.splice(1, 0, {
      id: "posts",
      value: formatProfileMobileStatCount(input.postsCount),
      label: TRIBE_DETAIL_MOBILE_STAT_POSTS,
    });
  }

  items.push({
    id: "category",
    value: tribeCategoryLabel(input.tribe.category).split(" ")[0] ?? "—",
    label: TRIBE_DETAIL_MOBILE_STAT_CATEGORY,
  });

  return items.slice(0, 4);
}

export function formatTribeDetailMobileMembersLine(count: number): string {
  return `${formatProfileMobileStatCount(count)} membre${count > 1 ? "s" : ""}`;
}
