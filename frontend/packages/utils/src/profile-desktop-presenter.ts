import type { LocalEvent, ProfileMe, Tribe } from "@yunicity/types";

import {
  PASSPORT_JOURNEY_LEVELS,
  type PassportLevelView,
} from "./passport-dashboard";
import type { ProfileTimelineItemKind } from "./profile-portal";
import {
  PROFILE_DESKTOP_ACTIVITY_KIND_BADGE,
  PROFILE_DESKTOP_ACTIVITY_KIND_EVENT_INTEREST,
  PROFILE_DESKTOP_ACTIVITY_KIND_EVENT_SAVED,
  PROFILE_DESKTOP_ACTIVITY_KIND_PASSPORT,
  PROFILE_DESKTOP_ACTIVITY_KIND_POST,
  PROFILE_DESKTOP_ACTIVITY_KIND_STAMP,
  PROFILE_DESKTOP_CITY_ONLY,
  PROFILE_DESKTOP_MEMBER_SINCE,
  PROFILE_DESKTOP_PRIVATE,
  PROFILE_DESKTOP_PUBLIC,
} from "./profile-desktop-labels";
import { tribeHref } from "./tribe-labels";

export type ProfileDesktopTabId =
  | "overview"
  | "publications"
  | "contributions"
  | "activity"
  | "about";

export type ProfileDesktopTribeRailItem = {
  id: string;
  name: string;
  href: string;
  status: "member" | "pending";
};

export type ProfileDesktopGlanceOuting = {
  title: string;
  whenLabel: string;
  href: string;
};

export function resolveProfileDesktopActivityKindLabel(kind: ProfileTimelineItemKind): string {
  switch (kind) {
    case "stamp":
      return PROFILE_DESKTOP_ACTIVITY_KIND_STAMP;
    case "event_saved":
      return PROFILE_DESKTOP_ACTIVITY_KIND_EVENT_SAVED;
    case "event_interest":
      return PROFILE_DESKTOP_ACTIVITY_KIND_EVENT_INTEREST;
    case "badge_earned":
      return PROFILE_DESKTOP_ACTIVITY_KIND_BADGE;
    case "passport_activated":
      return PROFILE_DESKTOP_ACTIVITY_KIND_PASSPORT;
    case "post":
    default:
      return PROFILE_DESKTOP_ACTIVITY_KIND_POST;
  }
}

export function formatProfileDesktopMemberSince(
  createdAt: string,
  now = new Date(),
): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return PROFILE_DESKTOP_MEMBER_SINCE(
      now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    );
  }
  const monthYear = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return PROFILE_DESKTOP_MEMBER_SINCE(monthYear);
}

export function resolveProfileDesktopVisibilityLabel(
  visibility: ProfileMe["visibility"],
): string {
  if (visibility === "private") return PROFILE_DESKTOP_PRIVATE;
  if (visibility === "city_only") return PROFILE_DESKTOP_CITY_ONLY;
  return PROFILE_DESKTOP_PUBLIC;
}

export function resolveProfileDesktopPassportSteps(
  levelView: PassportLevelView | null,
): { done: number; total: number; percent: number; levelLabel: string } {
  const total = PASSPORT_JOURNEY_LEVELS.length;
  if (!levelView) {
    return { done: 1, total, percent: 0, levelLabel: "Explorateur local" };
  }
  const index = PASSPORT_JOURNEY_LEVELS.findIndex((level) => level.id === levelView.level.id);
  const done = Math.max(1, index + 1);
  return {
    done,
    total,
    percent: levelView.progressPercent,
    levelLabel: levelView.level.label,
  };
}

export function buildProfileDesktopTribeRailItems(input: {
  city: string;
  tribes: Tribe[];
  maxItems?: number;
}): ProfileDesktopTribeRailItem[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const items: ProfileDesktopTribeRailItem[] = [];

  for (const tribe of input.tribes) {
    if (tribe.is_archived) continue;
    if (tribe.viewer_is_member) {
      items.push({
        id: tribe.id,
        name: tribe.name,
        href: tribeHref(tribe.slug, city),
        status: "member",
      });
    } else if (tribe.viewer_has_pending_join_request) {
      items.push({
        id: tribe.id,
        name: tribe.name,
        href: tribeHref(tribe.slug, city),
        status: "pending",
      });
    }
    if (items.length >= maxItems) break;
  }

  return items;
}

/** Tribus publiques affichées sur le profil d'un autre citoyen (membre du profil). */
export function buildProfilePublicTribeRailItems(input: {
  city: string;
  tribes: Tribe[];
  maxItems?: number;
}): ProfileDesktopTribeRailItem[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  return input.tribes
    .filter((tribe) => !tribe.is_archived && tribe.visibility === "public")
    .slice(0, maxItems)
    .map((tribe) => ({
      id: tribe.id,
      name: tribe.name,
      href: tribeHref(tribe.slug, city),
      status: "member" as const,
    }));
}

export function resolveProfileDesktopActiveTribe(input: {
  city: string;
  tribes: Tribe[];
}): ProfileDesktopTribeRailItem | null {
  const members = buildProfileDesktopTribeRailItems({
    ...input,
    maxItems: 1,
  }).filter((item) => item.status === "member");
  return members[0] ?? null;
}

export function resolveProfileDesktopNextOuting(
  savedEvents: LocalEvent[],
  now = new Date(),
): ProfileDesktopGlanceOuting | null {
  const upcoming = savedEvents
    .filter((event) => !event.is_cancelled && Date.parse(event.starts_at) >= now.getTime())
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));

  const event = upcoming[0];
  if (!event) return null;

  const starts = new Date(event.starts_at);
  const whenLabel = Number.isNaN(starts.getTime())
    ? ""
    : starts.toLocaleDateString("fr-FR", { weekday: "long" });

  return {
    title: event.title,
    whenLabel: whenLabel ? whenLabel.charAt(0).toUpperCase() + whenLabel.slice(1) : "",
    href: `/events/${event.id}`,
  };
}

export const PROFILE_DESKTOP_INTEREST_TONE: Record<
  string,
  "violet" | "blue" | "green" | "orange" | "sky" | "neutral"
> = {
  culture: "violet",
  art: "violet",
  music: "violet",
  tech: "blue",
  gaming: "blue",
  entrepreneurship: "green",
  business: "green",
  food: "orange",
  nightlife: "orange",
  sports: "sky",
  fitness: "sky",
};
