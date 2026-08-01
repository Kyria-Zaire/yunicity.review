/** Cultural places UI labels (WEB-MAP-03). */

import type { CulturalPlaceListItem } from "@yunicity/types";

export const MAP_CULTURE_ROUTE_CTA = "Voir l’itinéraire";
export const MAP_CULTURE_DETAILS_CTA = "Détails";
export const MAP_CULTURE_FROM_MY_POSITION = "Depuis ma position";
export const MAP_CULTURE_CLOSE_ROUTE = "Fermer l’itinéraire";
export const MAP_CULTURE_ROUTE_ERROR = "Itinéraire indisponible pour le moment.";
export const MAP_CULTURE_ROUTE_PANEL_PREFIX = "Itinéraire vers";
export const MAP_CULTURE_IMAGE_PLACEHOLDER = "Lieu emblématique";

/** WEB-MAP-03B — origin picker before route calculation. */
export const MAP_ROUTE_ORIGIN_TITLE = "D’où partez-vous ?";
export const MAP_ROUTE_DESTINATION_LABEL = "Destination";
export const MAP_ROUTE_ENTER_ADDRESS = "Entrer une adresse";
export const MAP_ROUTE_USE_MAP_CENTER = "Utiliser le centre de la carte";
export const MAP_ROUTE_CALCULATE = "Calculer l’itinéraire";
export const MAP_ROUTE_GEO_DENIED =
  "Position non autorisée. Vous pouvez entrer une adresse ou utiliser le centre de la carte.";
export const MAP_ROUTE_ADDRESS_NOT_FOUND = "Adresse introuvable.";
export const MAP_ROUTE_ADDRESS_PLACEHOLDER = "Ex. 2 place du Cardinal Luçon, Reims";
export const MAP_ROUTE_BACK = "Retour";
export const MAP_ROUTE_MODE_WALK = "À pied";
export const MAP_ROUTE_MODE_DRIVE = "Voiture";
export const MAP_ROUTE_MODE_BIKE = "Vélo";

const CATEGORY_LABELS: Record<string, string> = {
  cathedral: "Patrimoine",
  museum: "Musée",
  monument: "Monument",
  heritage: "Patrimoine",
  market: "Marché",
  square: "Place",
  library: "Bibliothèque",
  winery: "Maison de champagne",
  theatre: "Opéra & théâtre",
  park: "Parc",
  // Le filtre « Sport » existait déjà dans places-portal, mais sans libellé : une fiche
  // de catégorie `sport` retombait sur « Lieu culturel » (QUARTIER-01 phase 1).
  sport: "Sport",
};

export function culturalPlaceCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? "Lieu culturel";
}

/** Toutes les catégories connues de lieu culturel — SOURCE UNIQUE (les clés de CATEGORY_LABELS). */
export const CULTURAL_PLACE_CATEGORIES: readonly string[] = Object.keys(CATEGORY_LABELS);

/** Catégories classées « nature ». TOUT le reste est « culture » → aucune ne disparaît du filtre. */
export const NATURE_PLACE_CATEGORIES: readonly string[] = ["park"];

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

export function mapRouteModeLabel(profile: "walking" | "driving" | "cycling"): string {
  if (profile === "driving") return MAP_ROUTE_MODE_DRIVE;
  if (profile === "cycling") return MAP_ROUTE_MODE_BIKE;
  return MAP_ROUTE_MODE_WALK;
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
