import type { CulturalPlaceListItem, FeedPost, LocalEvent, Tribe, TribeMember } from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import { resolveEventHeroImage } from "./event-hero-image";
import { formatEventClockTime } from "./events-agenda";
import {
  TRIBE_DETAIL_PORTAL_FACT_CATEGORY,
  TRIBE_DETAIL_PORTAL_FACT_CREATED,
  TRIBE_DETAIL_PORTAL_FACT_LANGUAGE,
  TRIBE_DETAIL_PORTAL_FACT_VISIBILITY,
  TRIBE_DETAIL_PORTAL_LANGUAGE_VALUE,
  TRIBE_DETAIL_PORTAL_STAT_EVENTS,
  TRIBE_DETAIL_PORTAL_STAT_MEMBERS,
  TRIBE_DETAIL_PORTAL_STAT_POSTS,
  TRIBE_DETAIL_PORTAL_TAB_ABOUT,
  TRIBE_DETAIL_PORTAL_TAB_EVENTS,
  TRIBE_DETAIL_PORTAL_TAB_MEMBERS,
  TRIBE_DETAIL_PORTAL_TAB_POSTS,
} from "./tribe-detail-portal-labels";
import { findTribeForEvent } from "./tribe-portal";
import { TRIBES_PORTAL_THEME_LABELS } from "./tribe-portal-labels";
import { tribeCategoryLabel, tribeHref, tribeVisibilityLabel, TRIBE_ROLE_LABELS } from "./tribe-labels";
import { formatProfileActivityTimestamp } from "./profile-portal";

export type TribeDetailTabId = "about" | "events" | "posts" | "members";

export type TribeDetailTab = {
  id: TribeDetailTabId;
  label: string;
  anchor: string;
};

export type TribeDetailBreadcrumb = {
  label: string;
  href?: string;
};

export type TribeDetailQuickStat = {
  id: "members" | "events" | "posts";
  value: string;
  label: string;
};

export type TribeDetailAboutFact = {
  id: string;
  label: string;
  value: string;
};

export type TribeDetailEventCard = {
  id: string;
  title: string;
  description: string;
  locationLabel: string;
  dateBadgeDay: string;
  dateBadgeDate: string;
  dateBadgeMonth: string;
  timeLabel: string;
  imageUrl: string | null;
  href: string;
};

export type TribeDetailMemberPreview = {
  id: string;
  label: string;
  roleLabel: string;
  initial: string;
};

export type TribeDetailPostCard = {
  id: string;
  authorLabel: string;
  body: string;
  timestampLabel: string;
  imageUrl: string | null;
  href: string;
};

export type TribeDetailSidebarTribe = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  href: string;
  isActive: boolean;
};

export const TRIBE_DETAIL_TABS: TribeDetailTab[] = [
  { id: "about", label: TRIBE_DETAIL_PORTAL_TAB_ABOUT, anchor: "#tribe-about" },
  { id: "events", label: TRIBE_DETAIL_PORTAL_TAB_EVENTS, anchor: "#tribe-events" },
  { id: "posts", label: TRIBE_DETAIL_PORTAL_TAB_POSTS, anchor: "#tribe-posts" },
  { id: "members", label: TRIBE_DETAIL_PORTAL_TAB_MEMBERS, anchor: "#tribe-members" },
];

const THEME_BY_CATEGORY: Record<string, string[]> = {
  sport_local: ["sport-doux", "balade"],
  photography: ["photo"],
  volunteering: ["benevolat"],
  cafe_culture: ["cafe", "lecture", "culture"],
  students: ["culture"],
  music: ["musique", "culture"],
  association: ["culture", "benevolat"],
  other: ["culture"],
};

const BANNED_METRIC_PATTERN =
  /\b\d+[,.]\d+\s*\/\s*5|avis|note tribu|trending|leaderboard|#\d+/i;

function formatTribeEventDateParts(iso: string): Pick<
  TribeDetailEventCard,
  "dateBadgeDay" | "dateBadgeDate" | "dateBadgeMonth"
> {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateBadgeDay: "", dateBadgeDate: "", dateBadgeMonth: "" };
  }
  return {
    dateBadgeDay: date
      .toLocaleDateString("fr-FR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase(),
    dateBadgeDate: String(date.getDate()),
    dateBadgeMonth: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

function formatTribeEventTimeRange(startsAt: string, endsAt: string | null): string {
  const start = formatEventClockTime(startsAt);
  if (!endsAt) return start;
  const end = formatEventClockTime(endsAt);
  return end ? `${start} – ${end}` : start;
}

export function countTribeUpcomingEvents(tribe: Tribe, events: LocalEvent[], now = new Date()): number {
  return events.filter(
    (event) =>
      !event.is_cancelled &&
      new Date(event.starts_at) >= now &&
      findTribeForEvent(event, [tribe])?.id === tribe.id,
  ).length;
}

export function buildTribeDetailBreadcrumbs(tribe: Tribe): TribeDetailBreadcrumb[] {
  const city = tribe.city.trim() || "Reims";
  const cityHref = `/tribes?city=${encodeURIComponent(city)}`;
  return [
    { label: "Tribus", href: cityHref },
    { label: city, href: cityHref },
    { label: tribe.name },
  ];
}

export function buildTribeDetailHeroMeta(tribe: Tribe): string {
  const visibility = tribeVisibilityLabel(tribe.visibility);
  const members = `${tribe.active_member_count} membre${tribe.active_member_count > 1 ? "s" : ""}`;
  return `${visibility} · ${members} · ${tribe.city}`;
}

export function buildTribeDetailTags(tribe: Tribe): string[] {
  const tags = [tribeCategoryLabel(tribe.category)];
  const themeKeys = THEME_BY_CATEGORY[tribe.category] ?? ["culture"];
  for (const key of themeKeys) {
    const label = TRIBES_PORTAL_THEME_LABELS[key as keyof typeof TRIBES_PORTAL_THEME_LABELS];
    if (label && !tags.includes(label)) {
      tags.push(label);
    }
  }
  return tags.slice(0, 4);
}

export function buildTribeDetailQuickStats(input: {
  tribe: Tribe;
  eventsCount: number;
  postsCount: number | null;
}): TribeDetailQuickStat[] {
  const stats: TribeDetailQuickStat[] = [
    {
      id: "members",
      value: String(input.tribe.active_member_count),
      label: TRIBE_DETAIL_PORTAL_STAT_MEMBERS,
    },
    {
      id: "events",
      value: String(input.eventsCount),
      label: TRIBE_DETAIL_PORTAL_STAT_EVENTS,
    },
  ];
  if (input.postsCount != null) {
    stats.push({
      id: "posts",
      value: String(input.postsCount),
      label: TRIBE_DETAIL_PORTAL_STAT_POSTS,
    });
  }
  return stats;
}

export function formatTribeCreatedDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildTribeDetailAboutFacts(tribe: Tribe): TribeDetailAboutFact[] {
  const facts: TribeDetailAboutFact[] = [];
  const created = formatTribeCreatedDate(tribe.created_at);
  if (created) {
    facts.push({
      id: "created",
      label: TRIBE_DETAIL_PORTAL_FACT_CREATED,
      value: created,
    });
  }
  facts.push({
    id: "category",
    label: TRIBE_DETAIL_PORTAL_FACT_CATEGORY,
    value: tribeCategoryLabel(tribe.category),
  });
  facts.push({
    id: "language",
    label: TRIBE_DETAIL_PORTAL_FACT_LANGUAGE,
    value: TRIBE_DETAIL_PORTAL_LANGUAGE_VALUE,
  });
  facts.push({
    id: "visibility",
    label: TRIBE_DETAIL_PORTAL_FACT_VISIBILITY,
    value: tribeVisibilityLabel(tribe.visibility),
  });
  return facts;
}

export function buildTribeDetailEventCards(input: {
  tribe: Tribe;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): TribeDetailEventCard[] {
  const now = input.now ?? new Date();
  const maxItems = input.maxItems ?? 4;

  return input.events
    .filter(
      (event) =>
        !event.is_cancelled &&
        new Date(event.starts_at) >= now &&
        findTribeForEvent(event, [input.tribe])?.id === input.tribe.id,
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, maxItems)
    .map((event) => {
      const district =
        event.neighborhood_summary?.display_name ?? event.district?.trim() ?? null;
      const locationLabel = district
        ? `${event.location_name} · ${district}`
        : event.location_name;
      return {
        id: event.id,
        title: event.title,
        description: event.description?.trim() || formatEventDateRange(event.starts_at, event.ends_at),
        locationLabel,
        ...formatTribeEventDateParts(event.starts_at),
        timeLabel: formatTribeEventTimeRange(event.starts_at, event.ends_at),
        imageUrl: resolveEventHeroImage(event, input.culturalPlaces),
        href: `/events/${event.id}`,
      };
    });
}

export function buildTribeDetailMemberPreviews(
  members: TribeMember[],
  options?: { maxItems?: number; currentUserId?: string | null },
): TribeDetailMemberPreview[] {
  const maxItems = options?.maxItems ?? 6;
  const currentUserId = options?.currentUserId ?? null;

  return members.slice(0, maxItems).map((member) => {
    const isSelf = currentUserId != null && member.user_id === currentUserId;
    const shortId = member.user_id.slice(0, 8);
    return {
      id: member.user_id,
      label: isSelf ? "Vous" : `Membre · ${shortId}`,
      roleLabel: TRIBE_ROLE_LABELS[member.role] ?? member.role,
      initial: (isSelf ? "V" : shortId.charAt(0)).toUpperCase(),
    };
  });
}

export function buildTribeDetailPostCards(
  posts: FeedPost[],
  maxItems = 4,
  now = new Date(),
): TribeDetailPostCard[] {
  return posts.slice(0, maxItems).map((post) => ({
    id: post.id,
    authorLabel: post.author.display_name?.trim() || post.author.username || "Membre",
    body: post.body?.trim() || post.title?.trim() || "Publication sur le mur de la tribu.",
    timestampLabel: formatProfileActivityTimestamp(post.created_at, now),
    imageUrl: post.media_url,
    href: "#tribe-posts",
  }));
}

export function buildTribeDetailSidebarTribes(input: {
  city: string;
  tribes: Tribe[];
  activeSlug: string;
  maxItems?: number;
}): TribeDetailSidebarTribe[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 5;
  return input.tribes
    .filter((tribe) => tribe.viewer_is_member && !tribe.is_archived)
    .slice(0, maxItems)
    .map((tribe) => ({
      id: tribe.id,
      slug: tribe.slug,
      name: tribe.name,
      imageUrl: tribe.cover_image_url,
      href: tribeHref(tribe.slug, city),
      isActive: tribe.slug === input.activeSlug,
    }));
}

export function tribeDetailPortalCopyIsSafe(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}
