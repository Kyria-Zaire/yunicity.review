/** États publication / traitement Local Video — VIDEO-04C. */

import type { LocalVideo, LocalVideoFeedItem } from "@yunicity/types";

import {
  isLocalVideoProcessingFailed,
  isLocalVideoProcessingReady,
  LocalVideoError,
} from "./local-video-errors";

export type LocalVideoPublicationPhase =
  | "upload"
  | "publish"
  | "processing"
  | "published"
  | "failed";

export function resolveLocalVideoPublicationPhase(
  video: LocalVideo | null | undefined,
): LocalVideoPublicationPhase {
  if (!video) return "processing";
  if (isLocalVideoProcessingFailed(video)) return "failed";
  if (isLocalVideoProcessingReady(video)) return "published";
  if (video.status === "processing" || video.processing_status === "processing") {
    return "processing";
  }
  return "processing";
}

export function isLocalVideoFeedItemPlayable(item: LocalVideoFeedItem): boolean {
  return item.status === "published" && Boolean(item.media_url?.trim());
}

/** Slide feed non lisible — traitement ou échec pipeline. */
export function isLocalVideoFeedItemProcessing(item: LocalVideoFeedItem): boolean {
  if (item.status === "processing") return true;
  if (item.status === "failed") return true;
  return !item.media_url?.trim();
}

export function buildLocalVideoProcessingFailureError(
  video: LocalVideo,
): LocalVideoError {
  return new LocalVideoError(
    "LOCAL_VIDEO_TRANSCODE_FAILED",
    video.processing_error ?? "Impossible de préparer la vidéo.",
    500,
  );
}

export function localVideoFeedHref(videoId: string): string {
  return `/videos?video=${encodeURIComponent(videoId)}`;
}
