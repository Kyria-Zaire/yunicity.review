"use client";

import { useEffect, useState } from "react";

// Aligné sur le breakpoint carte de globals.css (bascule mobile/desktop à 640px).
const DESKTOP_QUERY = "(min-width: 640px)";

/**
 * `null` avant le montage (SSR / 1ère peinture), puis `true`/`false` selon le viewport.
 * Sert à ne monter qu'UNE instance de carte (mobile OU desktop), jamais les deux en même temps.
 */
export function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
