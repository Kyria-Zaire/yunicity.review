"use client";

import { useEffect, type RefObject } from "react";

import { CITIZEN_BOTTOM_NAV_HEIGHT_VAR } from "@/lib/layout/feed-mobile-refonte";

/**
 * Propriétaire courant de la variable : la DERNIÈRE barre montée. Lors d'une
 * navigation, l'ancienne barre peut être démontée APRÈS le montage de la
 * nouvelle ; sans ce jeton, son nettoyage effacerait la hauteur que la
 * nouvelle vient de publier.
 */
let proprietaire: symbol | null = null;

/**
 * BOTTOM-NAV-RESERVE-01 — publie sur `<html>` la hauteur RÉELLE de la barre
 * basse mobile (bordure et zone de sécurité comprises), en
 * `--citizen-bottom-nav-h`. La réserve `CITIZEN_MOBILE_BOTTOM_NAV_PADDING` la
 * consomme : 0 quand la barre est masquée (palier ≥ 640 px, parcours de
 * formulaire, fil de discussion…) ou démontée — jamais de valeur périmée.
 */
export function useCitizenBottomNavHeight(barre: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = barre.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const jeton = Symbol("citizen-bottom-nav");
    proprietaire = jeton;
    const racine = document.documentElement;

    function publier() {
      if (proprietaire !== jeton || !element) return;
      // `display: none` → 0 : la barre masquée ne réserve rien.
      const hauteur = Math.round(element.getBoundingClientRect().height);
      racine.style.setProperty(CITIZEN_BOTTOM_NAV_HEIGHT_VAR, `${hauteur}px`);
    }

    const observateur = new ResizeObserver(publier);
    observateur.observe(element);
    // Un masquage par CSS (palier, `:has(...)` d'un parcours) ne change pas
    // toujours la boîte observée au même instant : la racine sert de filet.
    observateur.observe(racine);
    publier();

    return () => {
      observateur.disconnect();
      if (proprietaire === jeton) {
        proprietaire = null;
        racine.style.removeProperty(CITIZEN_BOTTOM_NAV_HEIGHT_VAR);
      }
    };
  }, [barre]);
}
