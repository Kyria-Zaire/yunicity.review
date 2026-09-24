"use client";

import {
  VIDEOS_VIEWPORT_DESKTOP_MEDIA,
  VIDEOS_VIEWPORT_MEDIUM_MEDIA,
  VIDEOS_VIEWPORT_MOBILE_MEDIA,
  type VideosViewportTier,
} from "@/lib/layout/videos-breakpoints";
import { useSyncExternalStore } from "react";

function getTier(): VideosViewportTier {
  if (typeof window === "undefined") return "medium";
  if (window.matchMedia(VIDEOS_VIEWPORT_DESKTOP_MEDIA).matches) return "desktop";
  if (window.matchMedia(VIDEOS_VIEWPORT_MEDIUM_MEDIA).matches) return "medium";
  if (window.matchMedia(VIDEOS_VIEWPORT_MOBILE_MEDIA).matches) return "mobile";
  return "medium";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const media = [
    window.matchMedia(VIDEOS_VIEWPORT_DESKTOP_MEDIA),
    window.matchMedia(VIDEOS_VIEWPORT_MEDIUM_MEDIA),
    window.matchMedia(VIDEOS_VIEWPORT_MOBILE_MEDIA),
  ];
  for (const query of media) {
    query.addEventListener("change", onStoreChange);
  }
  return () => {
    for (const query of media) {
      query.removeEventListener("change", onStoreChange);
    }
  };
}

/** Palier viewport vidéos — montage conditionnel immersif (évite effets JS cachés en CSS). */
export function useVideosViewportTier(): VideosViewportTier {
  return useSyncExternalStore(subscribe, getTier, () => "medium");
}
