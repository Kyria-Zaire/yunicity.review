"use client";

import { useEffect } from "react";

import { CITIZEN_BOTTOM_NAV_HEIGHT_VAR } from "@/lib/layout/feed-mobile-refonte";

/**
 * Variable publiée sur `.videos-mobile-shell` : hauteur pixel réelle du lecteur
 * immersif au-dessus de la barre basse (visualViewport − nav mesurée).
 */
export const VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR =
  "--videos-mobile-immersive-viewport-height" as const;

export const VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR = "--videos-mobile-nav-band-bottom" as const;

const NAV_SELECTOR = ".web-mobile-strategic-bottom-nav";
const SHELL_SELECTOR = ".videos-mobile-shell";

/**
 * Hauteur de bande nav pour l'immersif.
 *
 * - Nav absente ou `display: none` (rotation / palier ≥ 640 px) → **0**.
 *   On n'utilise JAMAIS une `--citizen-bottom-nav-h` périmée dans ce cas.
 * - Nav visible et mesurable → hauteur réelle.
 * - Nav visible mais hauteur 0 (premier paint) → repli sur la var courante si > 0.
 */
export function resolveVideosMobileNavBandPx(
  nav: HTMLElement | null,
  citizenBottomNavH: string | null | undefined = undefined,
): number {
  if (!nav) return 0;
  if (getComputedStyle(nav).display === "none") return 0;

  const measured = Math.round(nav.getBoundingClientRect().height);
  if (measured > 0) return measured;

  const raw =
    citizenBottomNavH ??
    document.documentElement.style.getPropertyValue(CITIZEN_BOTTOM_NAV_HEIGHT_VAR);
  const fromVar = Number.parseFloat(raw || "0");
  return Number.isFinite(fromVar) && fromVar > 0 ? Math.round(fromVar) : 0;
}

/**
 * VIDEO-REFONTE-IOS-SAFARI-P0-02 / P0-B — aligne la hauteur immersif sur la
 * géométrie réelle iOS (visualViewport + nav mesurée), au lieu du seul
 * `calc(100dvh - 3.25rem - safe-area)`.
 *
 * Ne touche pas au zoom (pas de maximum-scale / user-scalable).
 */
export function useVideosMobileImmersiveViewport(active: boolean): void {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR);
    if (!shell) return;

    const publish = () => {
      const nav = document.querySelector<HTMLElement>(NAV_SELECTOR);
      const navBand = resolveVideosMobileNavBandPx(nav);

      const vv = window.visualViewport;
      const viewportH = Math.round(vv?.height ?? window.innerHeight);
      const available = Math.max(0, viewportH - navBand);

      shell.style.setProperty(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR, `${navBand}px`);
      shell.style.setProperty(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR, `${available}px`);
    };

    publish();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", publish);
    vv?.addEventListener("scroll", publish);
    window.addEventListener("resize", publish);

    const mobileNavQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(width < 640px)") : null;
    const onBreakpoint = () => publish();
    if (mobileNavQuery) {
      if (typeof mobileNavQuery.addEventListener === "function") {
        mobileNavQuery.addEventListener("change", onBreakpoint);
      } else {
        // Safari < 14
        mobileNavQuery.addListener(onBreakpoint);
      }
    }

    const Observer = globalThis.ResizeObserver;
    let observer: ResizeObserver | null = null;
    const nav = document.querySelector(NAV_SELECTOR);
    if (typeof Observer === "function") {
      observer = new Observer(publish);
      if (nav) observer.observe(nav);
      observer.observe(document.documentElement);
    }

    return () => {
      vv?.removeEventListener("resize", publish);
      vv?.removeEventListener("scroll", publish);
      window.removeEventListener("resize", publish);
      if (mobileNavQuery) {
        if (typeof mobileNavQuery.removeEventListener === "function") {
          mobileNavQuery.removeEventListener("change", onBreakpoint);
        } else {
          mobileNavQuery.removeListener(onBreakpoint);
        }
      }
      observer?.disconnect();
      shell.style.removeProperty(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR);
      shell.style.removeProperty(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR);
    };
  }, [active]);
}
