import type { LocalVideoFeedItem, LocalVideoTypeId } from "@yunicity/types";

import { isLocalVideoFeedItemPlayable } from "./local-video-processing-presenter";
import { LOCAL_VIDEO_TYPE_LABELS } from "./local-video-presenter";

export type VideosPortalTabId = "all" | "trending" | "new" | "subscriptions" | "mine";
export type VideosPortalSortId = "recent" | "popular";

export type VideosDurationFilterId = "all" | "short" | "medium" | "long";
export type VideosDateFilterId = "all" | "today" | "week" | "month";
export type VideosPopularityFilterId = "all" | "liked" | "commented";

export type VideosPortalSidebarFilters = {
  category: LocalVideoTypeId | "all";
  location: string;
  duration: VideosDurationFilterId;
  date: VideosDateFilterId;
  popularity: VideosPopularityFilterId;
};

export type VideoPortalCreator = {
  authorUserId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  latestVideoId: string;
  latestPublishedAt: string | null;
};

export const VIDEOS_PORTAL_PAGE_SIZE = 12;

export const DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS: VideosPortalSidebarFilters = {
  category: "all",
  location: "all",
  duration: "all",
  date: "all",
  popularity: "all",
};

const MS_PER_DAY = 86_400_000;

function videoTimestamp(item: LocalVideoFeedItem): number {
  const raw = item.published_at ?? item.created_at;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function matchesDuration(seconds: number, filter: VideosDurationFilterId): boolean {
  if (filter === "all") return true;
  if (filter === "short") return seconds < 60;
  if (filter === "medium") return seconds >= 60 && seconds <= 180;
  return seconds > 180;
}

function matchesDate(item: LocalVideoFeedItem, filter: VideosDateFilterId, now: Date): boolean {
  if (filter === "all") return true;
  const timestamp = videoTimestamp(item);
  if (timestamp <= 0) return false;
  const diffMs = now.getTime() - timestamp;
  if (filter === "today") return diffMs < MS_PER_DAY;
  if (filter === "week") return diffMs < MS_PER_DAY * 7;
  return diffMs < MS_PER_DAY * 31;
}

function matchesPopularity(item: LocalVideoFeedItem, filter: VideosPopularityFilterId): boolean {
  if (filter === "all") return true;
  if (filter === "liked") return item.like_count > 0;
  return item.comment_count > 0;
}

function matchesTab(
  item: LocalVideoFeedItem,
  tab: VideosPortalTabId,
  currentUserId?: string | null,
): boolean {
  switch (tab) {
    case "all":
      return true;
    case "trending":
      return item.like_count >= 1;
    case "new": {
      const ageMs = Date.now() - videoTimestamp(item);
      return ageMs >= 0 && ageMs < MS_PER_DAY * 14;
    }
    case "subscriptions":
      return false;
    case "mine":
      return Boolean(currentUserId && item.author_user_id === currentUserId);
    default:
      return true;
  }
}

export function filterVideosPortalItems(
  items: readonly LocalVideoFeedItem[],
  filters: VideosPortalSidebarFilters,
  tab: VideosPortalTabId,
  currentUserId?: string | null,
  now: Date = new Date(),
): LocalVideoFeedItem[] {
  return items.filter((item) => {
    if (!isLocalVideoFeedItemPlayable(item)) return false;
    if (filters.category !== "all" && item.video_type !== filters.category) return false;
    if (filters.location !== "all" && item.neighborhood_slug !== filters.location) return false;
    if (!matchesDuration(item.duration_seconds, filters.duration)) return false;
    if (!matchesDate(item, filters.date, now)) return false;
    if (!matchesPopularity(item, filters.popularity)) return false;
    return matchesTab(item, tab, currentUserId);
  });
}

export function sortVideosPortalItems(
  items: readonly LocalVideoFeedItem[],
  sort: VideosPortalSortId,
  tab: VideosPortalTabId,
): LocalVideoFeedItem[] {
  const next = [...items];
  if (tab === "trending") {
    return next.sort((a, b) => {
      const likes = b.like_count - a.like_count;
      if (likes !== 0) return likes;
      return videoTimestamp(b) - videoTimestamp(a);
    });
  }
  if (tab === "new" || sort === "recent") {
    return next.sort((a, b) => videoTimestamp(b) - videoTimestamp(a));
  }
  return next.sort((a, b) => {
    const likes = b.like_count - a.like_count;
    if (likes !== 0) return likes;
    return videoTimestamp(b) - videoTimestamp(a);
  });
}

export function pickFeaturedVideos(
  items: readonly LocalVideoFeedItem[],
  count = 4,
): LocalVideoFeedItem[] {
  const playable = items.filter(isLocalVideoFeedItemPlayable);
  const sorted = sortVideosPortalItems(playable, "recent", "new");
  return sorted.slice(0, count);
}

export function extractVideoPortalCreators(
  items: readonly LocalVideoFeedItem[],
  max = 8,
): VideoPortalCreator[] {
  const latestByAuthor = new Map<string, LocalVideoFeedItem>();

  for (const item of items) {
    if (!isLocalVideoFeedItemPlayable(item)) continue;
    const existing = latestByAuthor.get(item.author_user_id);
    if (!existing || videoTimestamp(item) > videoTimestamp(existing)) {
      latestByAuthor.set(item.author_user_id, item);
    }
  }

  return Array.from(latestByAuthor.values())
    .sort((a, b) => videoTimestamp(b) - videoTimestamp(a))
    .slice(0, max)
    .map((item) => ({
      authorUserId: item.author_user_id,
      displayName:
        item.author.full_name?.trim() ||
        item.author.username?.replace(/^@/, "") ||
        "Citoyen",
      handle: item.author.username?.trim()
        ? `@${item.author.username.replace(/^@/, "")}`
        : `@${item.author_user_id.slice(0, 8)}`,
      avatarUrl: item.author.avatar_url ?? null,
      latestVideoId: item.id,
      latestPublishedAt: item.published_at ?? item.created_at,
    }));
}

export function listVideoPortalNeighborhoods(items: readonly LocalVideoFeedItem[]): string[] {
  const slugs = new Set<string>();
  for (const item of items) {
    if (item.neighborhood_slug?.trim()) slugs.add(item.neighborhood_slug);
  }
  return Array.from(slugs).sort((a, b) => a.localeCompare(b, "fr"));
}

export function listVideoPortalCategoryOptions(): { value: LocalVideoTypeId | "all"; label: string }[] {
  return [
    { value: "all", label: "Toutes" },
    ...Object.entries(LOCAL_VIDEO_TYPE_LABELS).map(([value, label]) => ({
      value: value as LocalVideoTypeId,
      label,
    })),
  ];
}

export function isVideosPortalSidebarDefault(filters: VideosPortalSidebarFilters): boolean {
  return (
    filters.category === DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS.category &&
    filters.location === DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS.location &&
    filters.duration === DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS.duration &&
    filters.date === DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS.date &&
    filters.popularity === DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS.popularity
  );
}

export function resolveVideoPortalNeighborhoodLabel(
  slug: string,
  items: readonly LocalVideoFeedItem[],
): string {
  const match = items.find((item) => item.neighborhood_slug === slug);
  return match?.neighborhood_name?.trim() || slug;
}
