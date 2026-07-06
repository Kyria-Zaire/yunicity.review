import type { LocalVideoFeedItem } from "@yunicity/types";

import { formatLocalVideoDuration, resolveLocalVideoTeaserTitle } from "./local-video-teaser";
import {
  formatLocalVideoTypeLabel,
  formatVideoAuthorHandle,
  formatVideoTemporalLabel,
} from "./local-video-presenter";
import {
  VIDEO_DETAIL_VIEW,
  VIDEO_DETAIL_VIEWS,
} from "./local-video-detail-labels";

const MS_PER_DAY = 86_400_000;
const NEW_VIDEO_MAX_AGE_MS = MS_PER_DAY * 14;

export function resolveVideoDetailTitle(item: LocalVideoFeedItem): string {
  return resolveLocalVideoTeaserTitle(item);
}

export function formatVideoViewCountLabel(count: number): string {
  const safe = Math.max(0, Math.floor(count));
  if (safe <= 0) return `0 ${VIDEO_DETAIL_VIEWS}`;
  if (safe === 1) return `1 ${VIDEO_DETAIL_VIEW}`;
  return `${safe} ${VIDEO_DETAIL_VIEWS}`;
}

export function formatVideoDetailPublishedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVideoDetailLocation(item: LocalVideoFeedItem): string {
  const place = item.cultural_place_name?.trim();
  const neighborhood = item.neighborhood_name?.trim();
  if (place && neighborhood) return `${place}, ${item.city}`;
  if (neighborhood) return `${neighborhood}, ${item.city}`;
  return item.city;
}

export function formatVideoDetailRelatedMeta(item: LocalVideoFeedItem): string {
  return `${formatVideoViewCountLabel(item.view_count ?? 0)} • ${formatVideoTemporalLabel(item.published_at)}`;
}

export function isVideoDetailNew(item: LocalVideoFeedItem, now: Date = new Date()): boolean {
  const raw = item.published_at ?? item.created_at;
  const published = new Date(raw);
  if (Number.isNaN(published.getTime())) return false;
  return now.getTime() - published.getTime() < NEW_VIDEO_MAX_AGE_MS;
}

export function pickRelatedVideos(
  items: readonly LocalVideoFeedItem[],
  currentVideoId: string,
  limit = 4,
): LocalVideoFeedItem[] {
  return items.filter((item) => item.id !== currentVideoId).slice(0, limit);
}

export function formatVideoDetailCategory(item: LocalVideoFeedItem): string {
  return formatLocalVideoTypeLabel(item.video_type);
}

export function formatVideoDetailAuthorLine(item: LocalVideoFeedItem): string {
  return formatVideoAuthorHandle(item);
}

/** Tags territoire / thème pour la page détail mobile. */
export function buildVideoDetailMobileTags(item: LocalVideoFeedItem): string[] {
  const tags: string[] = [];
  const city = item.city?.trim();
  if (city) tags.push(`#${city.toLowerCase()}`);
  const category = formatLocalVideoTypeLabel(item.video_type);
  if (category) {
    const slug = category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    tags.push(`#${slug}`);
  }
  if (item.video_type === "bon_plan" || item.local_event_id) {
    tags.push("#Sortir");
  } else if (item.neighborhood_name?.trim()) {
    tags.push(`#${item.neighborhood_name.trim().replace(/\s+/g, "")}`);
  }
  return [...new Set(tags)].slice(0, 3);
}

export function formatVideoDetailMobileMetaLine(item: LocalVideoFeedItem): string {
  return `${formatVideoTemporalLabel(item.published_at)} • ${formatVideoViewCountLabel(item.view_count ?? 0)}`;
}
