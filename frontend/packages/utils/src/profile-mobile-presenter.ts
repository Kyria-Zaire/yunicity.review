import type { FeedPost, ProfileMe } from "@yunicity/types";

import {
  PROFILE_MOBILE_SHORTCUT_ACTIVITY,
  PROFILE_MOBILE_SHORTCUT_EVENTS,
  PROFILE_MOBILE_SHORTCUT_FAVORITES,
  PROFILE_MOBILE_SHORTCUT_OFFERS,
  PROFILE_MOBILE_SHORTCUT_PASSPORT,
  PROFILE_MOBILE_SHORTCUT_VIEW_ALL,
} from "./profile-mobile-labels";

export type ProfileMobileContentTabId = "publications" | "videos" | "reviews" | "photos";

export type ProfileMobileShortcut = {
  id: "favorites" | "events" | "offers" | "activity";
  label: string;
  href: string;
  valueLabel: string;
  showAsLink?: boolean;
};

/** Formate un compteur profil mobile (ex. 1200 → 1,2K). */
export function formatProfileMobileStatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toFixed(1).replace(".0", "").replace(".", ",")}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands.toFixed(1).replace(".0", "").replace(".", ",")}K`;
  }
  return String(value);
}

/** Publications citoyen sur le fil local — données réelles uniquement. */
export function filterProfileUserFeedPosts(
  posts: FeedPost[],
  profile: ProfileMe,
): FeedPost[] {
  return posts
    .filter(
      (post) =>
        post.type === "post" &&
        post.author.type === "citizen" &&
        post.author.id === profile.user_id,
    )
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
}

export function buildProfileMobileShortcuts(input: {
  savedEventsCount: number;
  interestedEventsCount: number;
}): ProfileMobileShortcut[] {
  return [
    {
      id: "favorites",
      label: PROFILE_MOBILE_SHORTCUT_FAVORITES,
      href: "/events",
      valueLabel: formatProfileMobileStatCount(input.savedEventsCount),
    },
    {
      id: "events",
      label: PROFILE_MOBILE_SHORTCUT_EVENTS,
      href: "/events",
      valueLabel: formatProfileMobileStatCount(input.interestedEventsCount),
    },
    {
      id: "offers",
      label: PROFILE_MOBILE_SHORTCUT_OFFERS,
      href: "/passport",
      valueLabel: PROFILE_MOBILE_SHORTCUT_PASSPORT,
      showAsLink: true,
    },
    {
      id: "activity",
      label: PROFILE_MOBILE_SHORTCUT_ACTIVITY,
      href: "/feed",
      valueLabel: PROFILE_MOBILE_SHORTCUT_VIEW_ALL,
      showAsLink: true,
    },
  ];
}

export function resolveProfileMobileLevelXpLabel(
  points: number,
  nextThreshold: number | null,
): string {
  if (nextThreshold == null || nextThreshold <= points) {
    return `${points} XP`;
  }
  return `${points} / ${nextThreshold} XP`;
}
