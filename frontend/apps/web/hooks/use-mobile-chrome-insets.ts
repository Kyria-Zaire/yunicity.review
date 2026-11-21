"use client";

import { useEffect, type RefObject } from "react";

/**
 * Expose, sur l'élément racine du shell, la hauteur RÉELLE des barres fixes
 * mobiles, en variables CSS :
 *
 *   --new-post-chrome-top     en-tête Yunicity (zone sûre comprise)
 *   --new-post-header-h       en-tête du composeur, collé dessous sur mobile
 *   --new-post-chrome-bottom  barre basse (zone sûre comprise)
 *
 * Mesurées, jamais codées en dur : une évolution du shell (taille du logo,
 * zone sûre d'un appareil) ne doit pas faire passer « Publier » ou l'encart
 * d'échec sous une barre. Au-delà du palier mobile, ces barres sont masquées
 * et valent donc 0.
 */
export function useMobileChromeInsets(racine: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = racine.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const mesures: ReadonlyArray<readonly [string, string]> = [
      ["--new-post-chrome-top", "header.web-mobile-chrome-only"],
      ["--new-post-header-h", "[data-new-post-header]"],
      ["--new-post-chrome-bottom", "nav.web-mobile-strategic-bottom-nav"],
    ];

    function mettreAJour() {
      if (!element) return;
      for (const [variable, selecteur] of mesures) {
        const cible = element.querySelector(selecteur);
        const hauteur = cible ? cible.getBoundingClientRect().height : 0;
        element.style.setProperty(variable, `${Math.round(hauteur)}px`);
      }
    }

    const observateur = new ResizeObserver(mettreAJour);
    for (const [, selecteur] of mesures) {
      const cible = element.querySelector(selecteur);
      if (cible) observateur.observe(cible);
    }
    // Le passage mobile ↔ medium masque les barres : la largeur compte aussi.
    observateur.observe(element);
    mettreAJour();
    return () => observateur.disconnect();
  }, [racine]);
}
