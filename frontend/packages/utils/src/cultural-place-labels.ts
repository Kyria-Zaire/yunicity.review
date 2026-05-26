/** Cultural places UI labels (WEB-MAP-03). */

import type { CulturalPlaceListItem } from "@yunicity/types";

export const MAP_CULTURE_ROUTE_CTA = "Voir l’itinéraire";
export const MAP_CULTURE_DETAILS_CTA = "Détails";
export const MAP_CULTURE_FROM_MY_POSITION = "Depuis ma position";
export const MAP_CULTURE_CLOSE_ROUTE = "Fermer l’itinéraire";
export const MAP_CULTURE_ROUTE_ERROR = "Itinéraire indisponible pour le moment.";
export const MAP_CULTURE_ROUTE_PANEL_PREFIX = "Itinéraire vers";
export const MAP_CULTURE_IMAGE_PLACEHOLDER = "Lieu emblématique";

const CATEGORY_LABELS: Record<string, string> = {
  cathedral: "Cathédrale",
  museum: "Musée",
  monument: "Monument",
  heritage: "Patrimoine",
  market: "Marché",
  square: "Place",
  library: "Bibliothèque",
  winery: "Maison de champagne",
};

export function culturalPlaceCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? "Lieu culturel";
}

export function culturalPlaceLocationLine(place: CulturalPlaceListItem): string {
  const hood = place.neighborhood?.display_name;
  if (hood) {
    return `${hood} · ${place.address}`;
  }
  return place.address;
}

export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}
