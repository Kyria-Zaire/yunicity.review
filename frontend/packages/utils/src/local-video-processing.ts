/** Polling traitement vidéo async — sans UI (VIDEO-04A / prépare VIDEO-04C). */

import type { LocalVideo, LocalVideoProcessingStatusId } from "@yunicity/types";

import type { LocalVideosApi } from "./local-videos-api";
import {
  isLocalVideoProcessingFailed,
  isLocalVideoProcessingReady,
  LocalVideoError,
} from "./local-video-errors";

export type LocalVideoPollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_POLL_TIMEOUT_MS = 180_000;

export function getProcessingStatus(video: LocalVideo): LocalVideoProcessingStatusId {
  return video.processing_status;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Polling annulé.", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Polling annulé.", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Poll `GET /local-videos/{id}` jusqu'à ready ou failed.
 * Réutilisable Web et Expo (injecte LocalVideosApi).
 */
export async function pollLocalVideoUntilSettled(
  api: LocalVideosApi,
  videoId: string,
  options: LocalVideoPollOptions = {},
): Promise<LocalVideo> {
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const started = Date.now();

  while (true) {
    const video = await api.getVideo(videoId);

    if (isLocalVideoProcessingReady(video) || isLocalVideoProcessingFailed(video)) {
      return video;
    }

    if (Date.now() - started >= timeoutMs) {
      throw new LocalVideoError(
        "LOCAL_VIDEO_PROCESSING_TIMEOUT",
        "Délai de traitement vidéo dépassé.",
        504,
      );
    }

    await sleep(intervalMs, options.signal);
  }
}
