"use client";

import { useCallback } from "react";

import {
  DESKTOP_OVERLAY_GRID_TITLE_SELECTOR,
  consumeOverlayOpenScrollY,
  desktopOverlayTileSelector,
  resolveGridRestoreTarget,
  type GridRestoreTarget,
} from "@/lib/videos/desktop-overlay-navigation";

export type GridRestoreSnapshot = {
  scrollY: number;
  openingVideoId: string;
  origin: "grid" | "direct";
};

/** Mémoire module : survit au double montage Strict Mode du hook. */
let snapshot: GridRestoreSnapshot | null = null;
let lastViewedVideoId: string | null = null;
/** Invalide les re-pins différés d'une restauration précédente (évite d'écraser un nouveau scroll). */
let restoreGeneration = 0;
const pendingTimerIds: number[] = [];

function clearPendingRestoreTimers() {
  while (pendingTimerIds.length > 0) {
    const id = pendingTimerIds.pop();
    if (id != null) window.clearTimeout(id);
  }
}

/**
 * R-FOCUS + mémorisation du défilement (PRD §5.5).
 *
 * Cause mesurée du Δ≈11 px (217→206, scrollHeight final 1117 stable) :
 * 1) `scrollIntoView(nearest)` après pin — retiré.
 * 2) Pré-clamp `Math.min(y, maxY)` pendant un `maxY` transitoire au unlock
 *    overflow/gutter — retiré ; re-pins après stabilisation.
 * Les timers de re-pin sont annulés à la capture d'ouverture suivante pour
 * ne pas réécrire un scroll utilisateur ultérieur.
 */
export function useGridRestore() {
  const captureOpen = useCallback((openingVideoId: string, origin: "grid" | "direct") => {
    clearPendingRestoreTimers();
    restoreGeneration += 1;
    const markedScroll = origin === "grid" ? consumeOverlayOpenScrollY() : null;
    snapshot = {
      scrollY: markedScroll ?? window.scrollY,
      openingVideoId,
      origin,
    };
    lastViewedVideoId = openingVideoId;
  }, []);

  const noteViewed = useCallback((videoId: string) => {
    lastViewedVideoId = videoId;
  }, []);

  const getOrigin = useCallback((): "grid" | "direct" => {
    return snapshot?.origin ?? "direct";
  }, []);

  const resolveTarget = useCallback((gridIds: readonly string[]): GridRestoreTarget => {
    return resolveGridRestoreTarget({
      lastViewedVideoId,
      openingVideoId: snapshot?.openingVideoId ?? null,
      gridIds,
    });
  }, []);

  const restore = useCallback((gridIds: readonly string[]) => {
    if (!snapshot) return null;
    const snap = snapshot;
    const target = resolveGridRestoreTarget({
      lastViewedVideoId,
      openingVideoId: snap.openingVideoId,
      gridIds,
    });
    const scrollY = snap.origin === "direct" ? 0 : snap.scrollY;
    snapshot = null;

    clearPendingRestoreTimers();
    const generation = ++restoreGeneration;

    const pinScroll = () => {
      if (generation !== restoreGeneration) return;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };

    const focusTarget = () => {
      if (generation !== restoreGeneration) return;
      let el: HTMLElement | null = null;
      if (target.kind === "tile") {
        el = document.querySelector<HTMLElement>(desktopOverlayTileSelector(target.videoId));
      } else {
        el = document.querySelector<HTMLElement>(DESKTOP_OVERLAY_GRID_TITLE_SELECTOR);
      }
      if (!el) return;
      el.focus({ preventScroll: true });
    };

    const apply = () => {
      if (generation !== restoreGeneration) return;
      pinScroll();
      focusTarget();
      pinScroll();
    };

    apply();

    requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(() => {
        apply();
        pendingTimerIds.push(window.setTimeout(apply, 32));
        pendingTimerIds.push(window.setTimeout(apply, 48));
      });
    });

    return target;
  }, []);

  return {
    captureOpen,
    noteViewed,
    getOrigin,
    restore,
    resolveTarget,
  };
}

/** Annule les re-pins différés (clic vignette / navigation volontaire). */
export function cancelPendingGridRestorePins() {
  clearPendingRestoreTimers();
  restoreGeneration += 1;
}
