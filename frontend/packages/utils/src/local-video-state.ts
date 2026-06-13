import type { LocalVideoFeedItem } from "@yunicity/types";

/** Mise à jour optimiste like/unlike — sans descendre sous zéro. */
export function applyLocalVideoLikeToggle(
  item: LocalVideoFeedItem,
  liked: boolean,
): LocalVideoFeedItem {
  if (item.liked_by_me === liked) {
    return item;
  }
  const delta = liked ? 1 : -1;
  return {
    ...item,
    liked_by_me: liked,
    like_count: Math.max(0, item.like_count + delta),
  };
}

export function applyLocalVideoLikeResponse(
  item: LocalVideoFeedItem,
  response: { liked: boolean; like_count: number },
): LocalVideoFeedItem {
  return {
    ...item,
    liked_by_me: response.liked,
    like_count: response.like_count,
  };
}

export function buildLocalVideoShareUrl(videoId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/videos?video=${encodeURIComponent(videoId)}`;
}

export type LocalVideoShareResult = "shared" | "copied" | "cancelled";

export async function shareLocalVideoWithFallback(
  video: Pick<LocalVideoFeedItem, "id" | "title" | "description">,
  origin?: string,
): Promise<LocalVideoShareResult> {
  const url = buildLocalVideoShareUrl(video.id, origin);
  const title = video.title?.trim() || "Vidéo Yunicity";
  const text = video.description?.slice(0, 120) ?? undefined;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
    return "cancelled";
  } catch {
    return "cancelled";
  }
}

const DEFAULT_DOUBLE_TAP_MS = 300;

export function isDoubleTap(lastTapAtMs: number | null, nowMs: number, windowMs = DEFAULT_DOUBLE_TAP_MS): boolean {
  if (lastTapAtMs == null) return false;
  return nowMs - lastTapAtMs <= windowMs;
}

export function bumpLocalVideoCommentCount(
  item: LocalVideoFeedItem,
  delta: number,
): LocalVideoFeedItem {
  return {
    ...item,
    comment_count: Math.max(0, item.comment_count + delta),
  };
}
