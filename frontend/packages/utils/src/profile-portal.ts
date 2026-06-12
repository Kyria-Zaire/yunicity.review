import type {
  FeedPost,
  LocalEvent,
  Neighborhood,
  PassportMe,
  PassportStamp,
  ProfileMe,
  Tribe,
} from "@yunicity/types";

import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";
import { resolveEventHeroImage } from "./event-hero-image";
import {
  buildPassportAchievements,
  buildPassportLevel,
  buildPassportRecentBadges,
  countEarnedPassportBadges,
  type PassportAchievementCard,
  type PassportDerivedBadge,
  type PassportLevelView,
} from "./passport-dashboard";
import { neighborhoodHref } from "./neighborhood-labels";
import {
  PROFILE_PORTAL_ACTIVITY_BADGE,
  PROFILE_PORTAL_ACTIVITY_EVENT_INTEREST,
  PROFILE_PORTAL_ACTIVITY_EVENT_SAVED,
  PROFILE_PORTAL_ACTIVITY_PASSPORT,
  PROFILE_PORTAL_ACTIVITY_POST,
  PROFILE_PORTAL_ACTIVITY_STAMP,
  PROFILE_PORTAL_ACTIVITY_TRIBE,
  PROFILE_PORTAL_BADGES_PREVIEW_EMPTY,
  PROFILE_PORTAL_IMPACT_ADVANCING,
  PROFILE_PORTAL_IMPACT_START,
  PROFILE_PORTAL_IMPACT_PROGRESS_SUFFIX,
  PROFILE_PORTAL_JOURNEY_CTA_EVENTS,
  PROFILE_PORTAL_JOURNEY_CTA_NEIGHBORHOODS,
  PROFILE_PORTAL_JOURNEY_CTA_TRIBES,
} from "./profile-portal-labels";
import { countMeetupsThisWeekForTribe, findTribeForEvent } from "./tribe-portal";
import { tribeHref } from "./tribe-labels";

export type ProfilePortalNavId =
  | "overview"
  | "activity"
  | "favorites"
  | "events"
  | "tribes"
  | "badges"
  | "settings";

export type ProfilePortalStatId =
  | "neighborhoods"
  | "moments"
  | "tribes"
  | "meetings"
  | "points";

export type ProfilePortalStat = {
  id: ProfilePortalStatId;
  value: number;
  valueLabel: string;
  unavailable: boolean;
};

export type ProfileActivityKind = "post" | "event_saved" | "event_interest";

export type ProfileTimelineItemKind =
  | ProfileActivityKind
  | "stamp"
  | "badge_earned"
  | "passport_activated";

export type ProfileActivityItem = {
  id: string;
  kind: ProfileActivityKind;
  title: string;
  description: string;
  timestampLabel: string;
  imageUrl: string | null;
  href: string;
  sortAt: string;
};

export type ProfileTimelineItem = {
  id: string;
  kind: ProfileTimelineItemKind;
  title: string;
  description: string;
  timestampLabel: string;
  imageUrl: string | null;
  href: string;
  sortAt: string;
};

export type ProfileLocalLandmarkKind = "tribe" | "event_saved" | "event_interest" | "badge" | "neighborhood";

export type ProfileLocalLandmark = {
  id: string;
  kind: ProfileLocalLandmarkKind;
  title: string;
  description: string;
  imageUrl: string | null;
  href: string;
};

export type ProfileJourneyCta = {
  id: string;
  title: string;
  href: string;
};

export type ProfileImpactLabel = {
  primary: string;
  secondary: string;
  showPercent: boolean;
  percent: number;
};

export type ProfileBadgesPreview = {
  badges: PassportDerivedBadge[];
  emptyCopy: string;
};

export type ProfileNeighborhoodCard = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  href: string;
};

export type ProfileTribeCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  memberCount: number;
  statusLine: string;
  href: string;
};

const BANNED_METRIC_PATTERN =
  /leaderboard|classement|#\d+\s*(sur|\/)\s*\d+|top\s*\d+|trending|viral/i;

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

function countUniqueNeighborhoodSlugs(stamps: PassportStamp[]): number {
  const slugs = new Set<string>();
  for (const stamp of stamps) {
    const slug = stamp.slug?.trim();
    if (slug) slugs.add(slug.toLowerCase());
  }
  return slugs.size;
}

export function formatProfileActivityTimestamp(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < MS_PER_MINUTE) return "À l’instant";
  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MS_PER_MINUTE);
    return `Il y a ${minutes} min`;
  }
  if (diffMs < MS_PER_DAY) {
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    return `Il y a ${hours} h`;
  }
  if (diffMs < 2 * MS_PER_DAY) {
    return `Aujourd’hui à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffMs < 7 * MS_PER_DAY) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    return days === 1 ? "Il y a 1 jour" : `Il y a ${days} jours`;
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function countUserFeedPosts(posts: FeedPost[], profile: ProfileMe): number {
  return posts.filter(
    (post) =>
      post.type === "post" &&
      post.author.type === "citizen" &&
      post.author.id === profile.user_id,
  ).length;
}

export function buildProfilePortalStats(input: {
  profile: ProfileMe;
  passport: PassportMe | null;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  feedPosts: FeedPost[];
}): ProfilePortalStat[] {
  const tribesJoined = input.tribes.filter((t) => t.viewer_is_member && !t.is_archived).length;
  const neighborhoods = countUniqueNeighborhoodSlugs(input.stamps);
  const meetings = input.savedEvents.length;
  const moments = countUserFeedPosts(input.feedPosts, input.profile);
  const points =
    input.passport?.progression?.reputation_score ??
    input.passport?.reputation_score ??
    0;

  return [
    {
      id: "neighborhoods",
      value: neighborhoods,
      valueLabel: String(neighborhoods),
      unavailable: false,
    },
    {
      id: "moments",
      value: moments,
      valueLabel: String(moments),
      unavailable: false,
    },
    {
      id: "tribes",
      value: tribesJoined,
      valueLabel: String(tribesJoined),
      unavailable: false,
    },
    {
      id: "meetings",
      value: meetings,
      valueLabel: String(meetings),
      unavailable: false,
    },
    {
      id: "points",
      value: points,
      valueLabel: String(points),
      unavailable: !input.passport,
    },
  ];
}

export function buildProfileActivityItems(input: {
  profile: ProfileMe;
  feedPosts: FeedPost[];
  savedEvents: LocalEvent[];
  culturalPlaces: Parameters<typeof resolveEventHeroImage>[1];
  maxItems?: number;
  now?: Date;
}): ProfileActivityItem[] {
  const now = input.now ?? new Date();
  const maxItems = input.maxItems ?? 6;
  const items: ProfileActivityItem[] = [];

  for (const post of input.feedPosts) {
    if (post.author.type !== "citizen" || post.author.id !== input.profile.user_id) {
      continue;
    }
    if (post.type === "post") {
      items.push({
        id: `post-${post.id}`,
        kind: "post",
        title: PROFILE_PORTAL_ACTIVITY_POST,
        description: post.body?.trim() || post.title?.trim() || "Publication sur le fil local.",
        timestampLabel: formatProfileActivityTimestamp(post.created_at, now),
        imageUrl: post.media_url,
        href: "/feed",
        sortAt: post.created_at,
      });
    }
  }

  for (const event of input.savedEvents) {
    items.push({
      id: `saved-${event.id}`,
      kind: event.interested_by_me ? "event_interest" : "event_saved",
      title: event.interested_by_me
        ? PROFILE_PORTAL_ACTIVITY_EVENT_INTEREST
        : PROFILE_PORTAL_ACTIVITY_EVENT_SAVED,
      description: `${event.title}${event.location_name ? ` · ${event.location_name}` : ""}`,
      timestampLabel: formatProfileActivityTimestamp(event.starts_at, now),
      imageUrl: resolveEventHeroImage(event, input.culturalPlaces),
      href: `/events/${event.id}`,
      sortAt: event.starts_at,
    });
  }

  return items
    .sort((a, b) => Date.parse(b.sortAt) - Date.parse(a.sortAt))
    .slice(0, maxItems);
}

export function buildProfileActivityTimeline(input: {
  profile: ProfileMe;
  passport: PassportMe | null;
  feedPosts: FeedPost[];
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  culturalPlaces: Parameters<typeof resolveEventHeroImage>[1];
  neighborhoods: Neighborhood[];
  maxItems?: number;
  now?: Date;
}): ProfileTimelineItem[] {
  const now = input.now ?? new Date();
  const maxItems = input.maxItems ?? 8;
  const city = input.profile.city?.trim() || "Reims";
  const items: ProfileTimelineItem[] = [];

  for (const post of input.feedPosts) {
    if (post.author.type !== "citizen" || post.author.id !== input.profile.user_id) {
      continue;
    }
    if (post.type !== "post") continue;
    items.push({
      id: `post-${post.id}`,
      kind: "post",
      title: PROFILE_PORTAL_ACTIVITY_POST,
      description: post.body?.trim() || post.title?.trim() || "Publication sur le fil local.",
      timestampLabel: formatProfileActivityTimestamp(post.created_at, now),
      imageUrl: post.media_url,
      href: "/feed",
      sortAt: post.created_at,
    });
  }

  for (const stamp of input.stamps) {
    if (!stamp.stamped_at?.trim()) continue;
    const slug = stamp.slug?.trim().toLowerCase();
    const hood = slug
      ? input.neighborhoods.find((n) => n.slug.toLowerCase() === slug)
      : undefined;
    items.push({
      id: `stamp-${stamp.id}`,
      kind: "stamp",
      title: PROFILE_PORTAL_ACTIVITY_STAMP,
      description: stamp.title?.trim() || stamp.human_line?.trim() || hood?.display_name || "Découverte locale",
      timestampLabel: formatProfileActivityTimestamp(stamp.stamped_at, now),
      imageUrl: hood ? resolveNeighborhoodEditorialImage(hood) : null,
      href: hood ? neighborhoodHref(hood.slug, city) : "/passport",
      sortAt: stamp.stamped_at,
    });
  }

  if (input.passport?.activated_at?.trim()) {
    items.push({
      id: "passport-activated",
      kind: "passport_activated",
      title: PROFILE_PORTAL_ACTIVITY_PASSPORT,
      description: `Passport ${input.passport.passport_number} — ${city}`,
      timestampLabel: formatProfileActivityTimestamp(input.passport.activated_at, now),
      imageUrl: null,
      href: "/passport",
      sortAt: input.passport.activated_at,
    });
  }

  if (input.passport) {
    const postsCount = countUserFeedPosts(input.feedPosts, input.profile);
    const badgeItems = buildPassportRecentBadges({
      passport: input.passport,
      stamps: input.stamps,
      tribes: input.tribes,
      savedEventsCount: input.savedEvents.length,
      postsCount,
    });
    for (const badge of badgeItems) {
      if (!badge.earned || !badge.earnedAt?.trim()) continue;
      items.push({
        id: `badge-${badge.id}`,
        kind: "badge_earned",
        title: PROFILE_PORTAL_ACTIVITY_BADGE,
        description: badge.title,
        timestampLabel: formatProfileActivityTimestamp(badge.earnedAt, now),
        imageUrl: null,
        href: "/passport",
        sortAt: badge.earnedAt,
      });
    }
  }

  return items
    .filter((item) => item.timestampLabel && Number.isFinite(Date.parse(item.sortAt)))
    .sort((a, b) => Date.parse(b.sortAt) - Date.parse(a.sortAt))
    .slice(0, maxItems);
}

export function buildProfileLocalJourneyItems(input: {
  city: string;
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  culturalPlaces: Parameters<typeof resolveEventHeroImage>[1];
  stamps: PassportStamp[];
  passport: PassportMe | null;
  feedPosts: FeedPost[];
  profile: ProfileMe;
  maxItems?: number;
}): ProfileLocalLandmark[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 6;
  const items: ProfileLocalLandmark[] = [];
  const seen = new Set<string>();

  const memberTribes = input.tribes.filter((t) => t.viewer_is_member && !t.is_archived);
  for (const tribe of memberTribes) {
    items.push({
      id: `tribe-${tribe.id}`,
      kind: "tribe",
      title: PROFILE_PORTAL_ACTIVITY_TRIBE,
      description: tribe.name,
      imageUrl: tribe.cover_image_url,
      href: tribeHref(tribe.slug, city),
    });
    seen.add(`tribe-${tribe.id}`);
    if (items.length >= maxItems) return items;
  }

  for (const event of input.savedEvents) {
    const key = `event-${event.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: key,
      kind: event.interested_by_me ? "event_interest" : "event_saved",
      title: event.interested_by_me
        ? PROFILE_PORTAL_ACTIVITY_EVENT_INTEREST
        : PROFILE_PORTAL_ACTIVITY_EVENT_SAVED,
      description: `${event.title}${event.location_name ? ` · ${event.location_name}` : ""}`,
      imageUrl: resolveEventHeroImage(event, input.culturalPlaces),
      href: `/events/${event.id}`,
    });
    if (items.length >= maxItems) return items;
  }

  if (input.passport) {
    const postsCount = countUserFeedPosts(input.feedPosts, input.profile);
    const badges = buildPassportRecentBadges({
      passport: input.passport,
      stamps: input.stamps,
      tribes: input.tribes,
      savedEventsCount: input.savedEvents.length,
      postsCount,
    });
    for (const badge of badges) {
      if (!badge.earned || !badge.earnedAt?.trim()) continue;
      const key = `badge-${badge.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: key,
        kind: "badge",
        title: PROFILE_PORTAL_ACTIVITY_BADGE,
        description: badge.title,
        imageUrl: null,
        href: "/passport",
      });
      if (items.length >= maxItems) return items;
    }
  }

  return items;
}

export function buildProfileJourneyCtas(city: string): ProfileJourneyCta[] {
  const resolvedCity = city.trim() || "Reims";
  const cityQuery = encodeURIComponent(resolvedCity);
  return [
    {
      id: "neighborhoods",
      title: PROFILE_PORTAL_JOURNEY_CTA_NEIGHBORHOODS,
      href: `/neighborhoods?city=${cityQuery}`,
    },
    {
      id: "tribes",
      title: PROFILE_PORTAL_JOURNEY_CTA_TRIBES,
      href: `/tribes?city=${cityQuery}`,
    },
    {
      id: "events",
      title: PROFILE_PORTAL_JOURNEY_CTA_EVENTS,
      href: `/events?city=${cityQuery}`,
    },
  ];
}

export function buildProfileBadgesPreview(input: {
  passport: PassportMe | null;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  feedPosts: FeedPost[];
  profile: ProfileMe;
  maxItems?: number;
}): ProfileBadgesPreview {
  if (!input.passport) {
    return { badges: [], emptyCopy: PROFILE_PORTAL_BADGES_PREVIEW_EMPTY };
  }
  const postsCount = countUserFeedPosts(input.feedPosts, input.profile);
  const all = buildPassportRecentBadges({
    passport: input.passport,
    stamps: input.stamps,
    tribes: input.tribes,
    savedEventsCount: input.savedEvents.length,
    postsCount,
  });
  const earned = all.filter((b) => b.earned);
  const pending = all.filter((b) => !b.earned);
  const badges = [...earned, ...pending].slice(0, input.maxItems ?? 4);
  return {
    badges,
    emptyCopy: PROFILE_PORTAL_BADGES_PREVIEW_EMPTY,
  };
}

export function formatProfileImpactLabel(
  impactPercent: number,
  levelView: PassportLevelView | null,
): ProfileImpactLabel {
  const percent = Math.min(100, Math.max(0, Math.round(impactPercent)));
  if (percent <= 0) {
    return {
      primary: PROFILE_PORTAL_IMPACT_START,
      secondary: levelView?.level.label ?? "Explorateur local",
      showPercent: false,
      percent: 0,
    };
  }
  if (percent >= 100) {
    return {
      primary: PROFILE_PORTAL_IMPACT_ADVANCING,
      secondary: levelView?.level.label ?? "Palier actuel",
      showPercent: false,
      percent,
    };
  }
  return {
    primary: `${percent} %`,
    secondary: PROFILE_PORTAL_IMPACT_PROGRESS_SUFFIX,
    showPercent: true,
    percent,
  };
}

export function buildProfileHeroSubtitle(input: {
  city: string;
  tribes: Tribe[];
  stampsCount: number;
  levelTitle: string;
}): string {
  const city = input.city.trim() || "Reims";
  const tribesJoined = input.tribes.filter((t) => t.viewer_is_member && !t.is_archived).length;

  if (tribesJoined === 1) {
    return "Membre d’une tribu locale.";
  }
  if (tribesJoined > 1) {
    return `Membre de ${tribesJoined} tribus locales.`;
  }
  if (input.stampsCount > 0) {
    return `Explore ${city} à travers ses quartiers et ses rencontres.`;
  }
  return `Votre parcours local commence à ${city}.`;
}

export function buildProfileNeighborhoodCards(input: {
  city: string;
  stamps: PassportStamp[];
  neighborhoods: Neighborhood[];
  maxItems?: number;
}): ProfileNeighborhoodCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const bySlug = new Map(input.neighborhoods.map((hood) => [hood.slug.toLowerCase(), hood]));
  const seen = new Set<string>();
  const cards: ProfileNeighborhoodCard[] = [];

  const sortedStamps = [...input.stamps].sort(
    (a, b) => Date.parse(b.stamped_at) - Date.parse(a.stamped_at),
  );

  for (const stamp of sortedStamps) {
    const slug = stamp.slug?.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const hood = bySlug.get(slug);
    const name = hood?.display_name ?? stamp.title?.trim() ?? slug;
    cards.push({
      id: `hood-${slug}`,
      slug,
      name,
      imageUrl: hood ? resolveNeighborhoodEditorialImage(hood) : null,
      href: hood ? neighborhoodHref(hood.slug, city) : `/neighborhoods?city=${encodeURIComponent(city)}`,
    });
    if (cards.length >= maxItems) break;
  }

  if (cards.length < maxItems) {
    for (const hood of input.neighborhoods) {
      if (seen.has(hood.slug.toLowerCase())) continue;
      cards.push({
        id: hood.id,
        slug: hood.slug,
        name: hood.display_name,
        imageUrl: resolveNeighborhoodEditorialImage(hood),
        href: neighborhoodHref(hood.slug, city),
      });
      if (cards.length >= maxItems) break;
    }
  }

  return cards;
}

export function buildProfileTribeCards(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  maxItems?: number;
}): ProfileTribeCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const memberTribes = input.tribes.filter((t) => t.viewer_is_member && !t.is_archived);

  return memberTribes.slice(0, maxItems).map((tribe) => {
    const meetups = countMeetupsThisWeekForTribe(tribe, input.events);
    let statusLine = "Cercle actif dans votre ville";
    if (meetups > 0) {
      statusLine =
        meetups === 1
          ? "1 rencontre cette semaine"
          : `${meetups} rencontres cette semaine`;
    } else {
      const linked = input.events.find(
        (event) => !event.is_cancelled && findTribeForEvent(event, [tribe]),
      );
      if (linked) {
        statusLine = `Prochain moment : ${linked.title}`;
      }
    }

    return {
      id: tribe.id,
      name: tribe.name,
      imageUrl: tribe.cover_image_url,
      memberCount: tribe.active_member_count,
      statusLine,
      href: tribeHref(tribe.slug, city),
    };
  });
}

export function resolveProfilePortalLevelTitle(levelView: PassportLevelView | null): string {
  if (!levelView) return "Explorateur local";
  return levelView.level.label;
}

export function resolveProfilePortalHeroImage(profile: ProfileMe): string | null {
  return profile.banner_url?.trim() || null;
}

export function buildProfilePortalImpactPercent(levelView: PassportLevelView | null): number {
  if (!levelView) return 0;
  return Math.min(100, Math.max(0, levelView.progressPercent));
}

export function buildProfilePortalBadgeItems(input: {
  passport: PassportMe | null;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  feedPosts: FeedPost[];
  profile: ProfileMe;
  maxItems?: number;
}): PassportDerivedBadge[] {
  if (!input.passport) return [];
  const postsCount = countUserFeedPosts(input.feedPosts, input.profile);
  const badges = buildPassportRecentBadges({
    passport: input.passport,
    stamps: input.stamps,
    tribes: input.tribes,
    savedEventsCount: input.savedEvents.length,
    postsCount,
  });
  const earned = badges.filter((b) => b.earned);
  const pending = badges.filter((b) => !b.earned);
  return [...earned, ...pending].slice(0, input.maxItems ?? 5);
}

export function buildProfilePortalAchievements(input: {
  passport: PassportMe;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  feedPosts: FeedPost[];
  profile: ProfileMe;
}): PassportAchievementCard[] {
  const postsCount = countUserFeedPosts(input.feedPosts, input.profile);
  return buildPassportAchievements({
    passport: input.passport,
    stamps: input.stamps,
    tribes: input.tribes,
    savedEventsCount: input.savedEvents.length,
    postsCount,
  });
}

export function profilePortalHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}

export {
  buildPassportLevel,
  countEarnedPassportBadges,
  type PassportLevelView,
};
