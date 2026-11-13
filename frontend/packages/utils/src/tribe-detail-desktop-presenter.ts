import type { FeedPost, Tribe } from "@yunicity/types";

import {
  TRIBE_DETAIL_DESKTOP_COMMUNITY_SUFFIX,
  TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_BODY,
  TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_TITLE,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_EVENTS,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_NEWS,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_PUBLISH,
  TRIBE_DETAIL_DESKTOP_RAIL_RULE_NO_SPAM,
  TRIBE_DETAIL_DESKTOP_RAIL_RULE_PRIVACY,
  TRIBE_DETAIL_DESKTOP_RAIL_RULE_RESPECT,
  TRIBE_DETAIL_DESKTOP_TAB_ABOUT,
  TRIBE_DETAIL_DESKTOP_TAB_DISCUSSIONS,
  TRIBE_DETAIL_DESKTOP_TAB_EVENTS,
  TRIBE_DETAIL_DESKTOP_TAB_MEMBERS,
  TRIBE_DETAIL_DESKTOP_TAB_OVERVIEW,
  TRIBE_DETAIL_DESKTOP_TEAM_PREFIX,
} from "./tribe-detail-desktop-labels";
import { resolveTribeHeroImage } from "./tribe-detail";
import { tribeCategoryLabel } from "./tribe-labels";

export type TribeDetailDesktopTabId = "overview" | "discussions" | "events" | "members" | "about";

export type TribeDetailDesktopTab = {
  id: TribeDetailDesktopTabId;
  label: string;
  anchor: string;
};

export type TribeDetailDesktopJoinBenefit = {
  id: string;
  label: string;
};

export type TribeDetailDesktopRule = {
  id: string;
  label: string;
};

export type TribeDetailDesktopFeaturedCard = {
  id: string;
  authorLabel: string;
  title: string;
  body: string;
  isPinned: boolean;
};

export const TRIBE_DETAIL_DESKTOP_TABS: TribeDetailDesktopTab[] = [
  { id: "overview", label: TRIBE_DETAIL_DESKTOP_TAB_OVERVIEW, anchor: "#tribe-overview" },
  { id: "discussions", label: TRIBE_DETAIL_DESKTOP_TAB_DISCUSSIONS, anchor: "#tribe-discussions" },
  { id: "events", label: TRIBE_DETAIL_DESKTOP_TAB_EVENTS, anchor: "#tribe-events" },
  { id: "members", label: TRIBE_DETAIL_DESKTOP_TAB_MEMBERS, anchor: "#tribe-members" },
  { id: "about", label: TRIBE_DETAIL_DESKTOP_TAB_ABOUT, anchor: "#tribe-about" },
];

export function buildTribeDetailDesktopLocationMeta(tribe: Tribe): string {
  const category = tribeCategoryLabel(tribe.category);
  return `${tribe.city} · ${category || TRIBE_DETAIL_DESKTOP_COMMUNITY_SUFFIX}`;
}

export function buildTribeDetailDesktopGalleryUrls(tribe: Tribe, posts: FeedPost[]): string[] {
  const urls: string[] = [];
  const hero = resolveTribeHeroImage(tribe);
  if (hero) urls.push(hero);
  for (const post of posts) {
    if (post.media_url && !urls.includes(post.media_url)) {
      urls.push(post.media_url);
    }
  }
  return urls;
}

export function buildTribeDetailDesktopJoinBenefits(): TribeDetailDesktopJoinBenefit[] {
  return [
    { id: "publish", label: TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_PUBLISH },
    { id: "news", label: TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_NEWS },
    { id: "events", label: TRIBE_DETAIL_DESKTOP_RAIL_JOIN_BENEFIT_EVENTS },
  ];
}

export function buildTribeDetailDesktopEssentialRules(): TribeDetailDesktopRule[] {
  return [
    { id: "respect", label: TRIBE_DETAIL_DESKTOP_RAIL_RULE_RESPECT },
    { id: "no-spam", label: TRIBE_DETAIL_DESKTOP_RAIL_RULE_NO_SPAM },
    { id: "privacy", label: TRIBE_DETAIL_DESKTOP_RAIL_RULE_PRIVACY },
  ];
}

export function buildTribeDetailDesktopFeaturedCard(
  tribe: Tribe,
  posts: FeedPost[],
): TribeDetailDesktopFeaturedCard {
  const first = posts[0];
  if (first) {
    const authorLabel =
      first.author.display_name?.trim() || first.author.username?.trim() || "Membre";
    return {
      id: first.id,
      authorLabel,
      title: first.title?.trim() || first.body?.trim().slice(0, 80) || TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_TITLE,
      body: first.body?.trim() || TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_BODY,
      isPinned: true,
    };
  }

  return {
    id: `welcome-${tribe.id}`,
    authorLabel: `${TRIBE_DETAIL_DESKTOP_TEAM_PREFIX} ${tribe.name}`,
    title: `${TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_TITLE} 👋`,
    body: tribe.description?.trim() || TRIBE_DETAIL_DESKTOP_FEATURED_WELCOME_BODY,
    isPinned: true,
  };
}

export function buildTribeDetailDesktopProjectUrls(posts: FeedPost[], maxItems = 8): string[] {
  const urls: string[] = [];
  for (const post of posts) {
    if (post.media_url && !urls.includes(post.media_url)) {
      urls.push(post.media_url);
    }
    if (urls.length >= maxItems) break;
  }
  return urls;
}
