"use client";

import { buildLocalVideoTeaserHref } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import {
  clearOverlayOpenSession,
  type OverlayOpenOrigin,
} from "@/lib/videos/desktop-overlay-navigation";

/**
 * D1 — push à l'ouverture (lien vignette), replace aux flèches,
 * fermeture : back si grille, replace si directe (jamais history.back aveugle).
 */
export function useVideoOverlayHistory() {
  const router = useRouter();
  const originRef = useRef<OverlayOpenOrigin>("direct");

  const setOrigin = useCallback((origin: OverlayOpenOrigin) => {
    originRef.current = origin;
  }, []);

  const getOrigin = useCallback(() => originRef.current, []);

  const replaceVideo = useCallback(
    (videoId: string) => {
      router.replace(buildLocalVideoTeaserHref(videoId), { scroll: false });
    },
    [router],
  );

  const closeOverlay = useCallback(() => {
    const origin = originRef.current;
    // L9 : libérer sticky grille pour qu'un prochain ?video= direct
    // ne hérite pas d'une origine « grid » (sinon back au lieu de replace).
    clearOverlayOpenSession();
    if (origin === "grid") {
      router.back();
      return;
    }
    router.replace("/videos", { scroll: false });
  }, [router]);

  return { setOrigin, getOrigin, replaceVideo, closeOverlay };
}
