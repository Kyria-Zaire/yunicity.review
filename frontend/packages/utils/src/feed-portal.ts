import type {
  CulturalPlaceListItem,
  FeedPost,
  LocalEvent,
  Neighborhood,
  ProfileMe,
  StoryRingItem,
  Tribe,
} from "@yunicity/types";

import { INTEREST_LABELS } from "./domain-labels";
import { resolveCulturalPlaceDisplayUrl } from "./cultural-place-display-image";
import { resolveFeaturedCarouselEventImage, resolveEventHeroImage } from "./event-hero-image";
import { eventCalendarDayKey, formatEventClockTime } from "./events-agenda";
import { buildMapPlaceUrl } from "./explorer-links";
import {
  FEED_PORTAL_EVENT_TODAY,
  FEED_PORTAL_EVENT_TOMORROW,
} from "./feed-portal-labels";
import { findTribeForEvent } from "./tribe-portal";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";
import { isEventTonight } from "./sortir-portal";
import { buildStoryRingDisplay } from "./stories-portal";

export type FeedPortalView = "for_you" | "recent" | "popular";

export type FeedStoryShortcut = {
  id: string;
  kind: "publish" | "mine" | "tribe" | "event" | "place";
  name: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
  hasActivity: boolean;
};

export type FeedTribeActivityItem = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
  hasActivity: boolean;
};

export type FeedHighlightEvent = {
  id: string;
  title: string;
  timeBadge: string;
  timeBadgeTone: "today" | "tomorrow" | "default";
  locationLine: string;
  imageUrl: string | null;
  href: string;
};

export type FeedTrendItem = {
  id: string;
  label: string;
  metaLine: string;
  href: string;
  icon: "event" | "place" | "neighborhood" | "tribe";
};

const INTEREST_POST_KEYWORDS: Record<string, string[]> = {
  culture: ["culture", "expo", "musée", "théâtre"],
  art: ["art", "expo", "galerie"],
  music: ["concert", "musique", "jazz", "live"],
  food: ["café", "restaurant", "gastronomie", "dégustation"],
  nightlife: ["soirée", "bar", "afterwork"],
  sports: ["running", "sport", "marche"],
  fitness: ["sport", "running", "yoga"],
  tech: ["tech", "atelier", "numérique"],
  gaming: ["jeu", "gaming"],
  business: ["networking", "business"],
  entrepreneurship: ["startup", "entrepreneur"],
};

export function formatFeedRelativeTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isTomorrow(iso: string, now = new Date()): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return eventCalendarDayKey(iso) === eventCalendarDayKey(tomorrow.toISOString());
}

function isToday(iso: string, now = new Date()): boolean {
  return eventCalendarDayKey(iso) === eventCalendarDayKey(now.toISOString());
}

function scorePostForInterests(post: FeedPost, interests: string[]): number {
  const blob = `${post.title ?? ""} ${post.body ?? ""} ${post.type} ${post.event?.event_type ?? ""}`.toLowerCase();
  let score = 0;
  for (const interest of interests) {
    const keywords = INTEREST_POST_KEYWORDS[interest] ?? [];
    if (keywords.some((kw) => blob.includes(kw))) score += 2;
    const label = INTEREST_LABELS[interest]?.toLowerCase();
    if (label && blob.includes(label.slice(0, 4))) score += 1;
  }
  if (post.type === "event" && interests.includes("culture")) score += 1;
  if (post.type === "offer" && interests.includes("food")) score += 1;
  return score;
}

export function filterFeedPostsByView(
  posts: FeedPost[],
  view: FeedPortalView,
  options: { interests?: string[]; userId?: string | null } = {},
): FeedPost[] {
  const copy = [...posts];
  if (view === "popular") {
    return copy.sort((a, b) => b.like_count - a.like_count || Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  if (view === "for_you") {
    const interests = options.interests ?? [];
    if (interests.length === 0) return copy;
    return copy
      .map((post) => ({ post, score: scorePostForInterests(post, interests) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || Date.parse(b.post.created_at) - Date.parse(a.post.created_at))
      .map((item) => item.post);
  }
  return copy;
}

export function filterFeedPostsDiscussions(posts: FeedPost[]): FeedPost[] {
  return posts.filter((post) => post.comment_count > 0);
}

export function filterFeedPostsContributions(posts: FeedPost[], userId: string | null): FeedPost[] {
  if (!userId) return [];
  return posts.filter((post) => post.author.id === userId && post.author.type === "citizen");
}

export function buildFeedStoryShortcuts(input: {
  city: string;
  profile: Pick<ProfileMe, "display_name" | "username" | "avatar_url" | "user_id"> | null;
  tribes: Tribe[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  storyRings?: StoryRingItem[];
  maxItems?: number;
  now?: Date;
}): FeedStoryShortcut[] {
  const maxItems = input.maxItems ?? 7;
  const now = input.now ?? new Date();
  const items: FeedStoryShortcut[] = [];

  const myStorySlot = buildStoryRingDisplay({
    profile: input.profile,
    rings: input.storyRings ?? [],
  })[0];
  if (myStorySlot) {
    items.push({
      id: myStorySlot.id,
      kind: myStorySlot.kind === "mine" ? "mine" : "publish",
      name: myStorySlot.name,
      subtitle: myStorySlot.subtitle,
      imageUrl: myStorySlot.imageUrl,
      href: myStorySlot.href,
      hasActivity: myStorySlot.hasActivity,
    });
  }

  const memberTribes = input.tribes.filter((t) => !t.is_archived && t.viewer_is_member);
  for (const tribe of memberTribes.slice(0, 3)) {
    const tonight = input.events.some(
      (e) => isEventTonight(e, now) && findTribeForEvent(e, [tribe]),
    );
    items.push({
      id: `tribe-${tribe.id}`,
      kind: "tribe",
      name: tribe.name,
      subtitle: tonight ? "Activité ce soir" : tribeCategoryLabel(tribe.category),
      imageUrl: null,
      href: tribeHref(tribe.slug, input.city),
      hasActivity: tonight,
    });
  }

  const tonightEvents = input.events
    .filter((e) => isEventTonight(e, now))
    .slice(0, 2);
  for (const event of tonightEvents) {
    items.push({
      id: `event-${event.id}`,
      kind: "event",
      name: event.title.slice(0, 24),
      subtitle: formatEventClockTime(event.starts_at),
      imageUrl: resolveFeaturedCarouselEventImage(event),
      href: `/events/${event.id}`,
      hasActivity: true,
    });
  }

  for (const place of input.culturalPlaces.filter((p) => p.is_featured).slice(0, 2)) {
    if (items.length >= maxItems) break;
    items.push({
      id: `place-${place.id}`,
      kind: "place",
      name: place.name,
      subtitle: place.neighborhood?.display_name ?? input.city,
      imageUrl: resolveCulturalPlaceDisplayUrl(place, "hero"),
      href: buildMapPlaceUrl(place.slug, { city: input.city }),
      hasActivity: false,
    });
  }

  return items.slice(0, maxItems);
}

export function buildFeedTribeActivityItems(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  maxItems?: number;
  now?: Date;
}): FeedTribeActivityItem[] {
  const now = input.now ?? new Date();
  return input.tribes
    .filter((tribe) => !tribe.is_archived && tribe.viewer_is_member)
    .map((tribe) => {
      const tonightEvent = input.events.find(
        (e) => isEventTonight(e, now) && findTribeForEvent(e, [tribe]),
      );
      return {
        id: tribe.id,
        name: tribe.name,
        subtitle: tonightEvent
          ? `${tonightEvent.title} · ${formatEventClockTime(tonightEvent.starts_at)}`
          : `${tribe.active_member_count} membre${tribe.active_member_count > 1 ? "s" : ""}`,
        imageUrl: null,
        href: tribeHref(tribe.slug, input.city),
        hasActivity: Boolean(tonightEvent),
      };
    })
    .slice(0, input.maxItems ?? 4);
}

export function buildFeedHighlightEvents(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): FeedHighlightEvent[] {
  const now = input.now ?? new Date();
  return input.events
    .filter((e) => !e.is_cancelled && Date.parse(e.starts_at) >= now.getTime())
    .slice()
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .slice(0, input.maxItems ?? 2)
    .map((event) => {
      const today = isToday(event.starts_at, now);
      const tomorrow = !today && isTomorrow(event.starts_at, now);
      return {
        id: event.id,
        title: event.title,
        timeBadge: today
          ? `${FEED_PORTAL_EVENT_TODAY} ${formatEventClockTime(event.starts_at)}`
          : tomorrow
            ? `${FEED_PORTAL_EVENT_TOMORROW} ${formatEventClockTime(event.starts_at)}`
            : formatEventClockTime(event.starts_at),
        timeBadgeTone: today ? "today" : tomorrow ? "tomorrow" : "default",
        locationLine:
          event.neighborhood_summary?.display_name ??
          event.district?.trim() ??
          event.location_name,
        imageUrl:
          resolveFeaturedCarouselEventImage(event) ??
          resolveEventHeroImage(event, input.culturalPlaces),
        href: `/events/${event.id}`,
      };
    });
}

export function buildFeedTrendItems(input: {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  neighborhoods: Neighborhood[];
  tribes: Tribe[];
  maxItems?: number;
}): FeedTrendItem[] {
  const city = input.city.trim() || "Reims";
  const items: FeedTrendItem[] = [];
  const event = input.events.find((e) => !e.is_cancelled);
  const place = input.culturalPlaces[0];
  const hood = input.neighborhoods.find((n) => n.is_active);
  const tribe = input.tribes.find((t) => !t.is_archived);

  if (event) {
    items.push({
      id: `trend-event-${event.id}`,
      label: event.title,
      metaLine: "Événement à venir",
      href: `/events/${event.id}`,
      icon: "event",
    });
  }
  if (place) {
    items.push({
      id: `trend-place-${place.id}`,
      label: place.name,
      metaLine: "Lieu culturel",
      href: buildMapPlaceUrl(place.slug, { city }),
      icon: "place",
    });
  }
  if (hood) {
    items.push({
      id: `trend-hood-${hood.id}`,
      label: hood.display_name,
      metaLine: "Quartier",
      href: `/neighborhoods/${hood.slug}?city=${encodeURIComponent(city)}`,
      icon: "neighborhood",
    });
  }
  if (tribe) {
    items.push({
      id: `trend-tribe-${tribe.id}`,
      label: tribe.name,
      metaLine: `${tribe.active_member_count} membres`,
      href: tribeHref(tribe.slug, city),
      icon: "tribe",
    });
  }

  return items.slice(0, input.maxItems ?? 4);
}
