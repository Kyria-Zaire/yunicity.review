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

/**
 * VIDEO-REFONTE-L2-PARTAGE-01 — cinq résultats distincts (H1 / H2 / H3).
 * `cancelled` = AbortError uniquement (silencieux, aucune copie).
 */
export type LocalVideoShareResult =
  | "shared"
  | "cancelled"
  | "failed"
  | "copied"
  | "unavailable";

export type LocalVideoCopyResult = "copied" | "unavailable";

function isShareAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/** Copie explicite du lien (repli sans `share`, ou « Copier le lien » depuis H2). */
export async function copyLocalVideoLink(url: string): Promise<LocalVideoCopyResult> {
  if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
    return "unavailable";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "unavailable";
  }
}

export async function shareLocalVideoWithFallback(
  video: Pick<LocalVideoFeedItem, "id" | "title" | "description">,
  origin?: string,
): Promise<LocalVideoShareResult> {
  const url = buildLocalVideoShareUrl(video.id, origin);
  const title = video.title?.trim() || "Vidéo Yunicity";
  const text = video.description?.slice(0, 120) ?? undefined;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (isShareAbortError(error)) return "cancelled";
      return "failed";
    }
  }

  return copyLocalVideoLink(url);
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
