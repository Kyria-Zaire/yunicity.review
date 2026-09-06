"use client";

import {
  MAP_VIEWPORT_DESKTOP_MEDIA,
  MAP_VIEWPORT_MEDIUM_MEDIA,
  MAP_VIEWPORT_MOBILE_MEDIA,
  type MapViewportTier,
} from "@/lib/layout/map-breakpoints";
import { useSyncExternalStore } from "react";

function getTier(): MapViewportTier {
  if (window.matchMedia(MAP_VIEWPORT_DESKTOP_MEDIA).matches) return "desktop";
  if (window.matchMedia(MAP_VIEWPORT_MEDIUM_MEDIA).matches) return "medium";
  if (window.matchMedia(MAP_VIEWPORT_MOBILE_MEDIA).matches) return "mobile";
  return "desktop";
}

function subscribe(onStoreChange: () => void): () => void {
  const media = [
    window.matchMedia(MAP_VIEWPORT_DESKTOP_MEDIA),
    window.matchMedia(MAP_VIEWPORT_MEDIUM_MEDIA),
    window.matchMedia(MAP_VIEWPORT_MOBILE_MEDIA),
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

/**
 * Palier viewport de la Carte — commande le CYCLE DE VIE de l'instance Google Maps,
 * jamais la source des données ni le déclenchement des fetchs.
 *
 * Calqué sur `useVideosViewportTier`. Remplace l'ancien `useIsDesktop()`, binaire à
 * 640px, qui rendait `mapReady` vrai simultanément pour l'arbre Medium et l'arbre
 * Desktop : deux instances Google Maps coexistaient au-dessus de 640px, dont une
 * dans un conteneur `display:none`.
 *
 * `null` avant le premier snapshot client — SSR et hydratation comprises. Aucun arbre
 * n'instancie de carte tant que le palier réel est inconnu : c'est ce qui garantit
 * qu'aucune instance masquée n'est créée puis détruite au premier rendu. C'est aussi
 * le comportement de la baseline de production (`useIsDesktop` retournait `null` avant
 * montage), donc aucun changement observable côté utilisateur.
 *
 * `useSyncExternalStore` plutôt que `useState` + `useEffect` : la valeur client est
 * lue au rendu qui suit immédiatement l'hydratation, sans passer par un effet.
 */
export function useMapViewportTier(): MapViewportTier | null {
  return useSyncExternalStore(subscribe, getTier, () => null);
}
