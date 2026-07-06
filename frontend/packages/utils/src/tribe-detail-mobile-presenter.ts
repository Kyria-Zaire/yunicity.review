import type { Tribe } from "@yunicity/types";

import { formatProfileMobileStatCount } from "./profile-mobile-presenter";
import {
  TRIBE_DETAIL_MOBILE_STAT_CATEGORY,
  TRIBE_DETAIL_MOBILE_STAT_EVENTS,
  TRIBE_DETAIL_MOBILE_STAT_MEMBERS,
  TRIBE_DETAIL_MOBILE_STAT_POSTS,
} from "./tribe-detail-mobile-labels";
import { tribeCategoryLabel } from "./tribe-labels";

export type TribeDetailMobileStatItem = {
  id: "members" | "posts" | "events" | "category";
  value: string;
  label: string;
};

export const TRIBE_DETAIL_MOBILE_TAB_IDS = [
  "featured",
  "discussions",
  "events",
  "members",
  "about",
] as const;

export type TribeDetailMobileTabId = (typeof TRIBE_DETAIL_MOBILE_TAB_IDS)[number];

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
