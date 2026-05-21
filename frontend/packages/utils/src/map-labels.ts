/** Event map UI micro-copy (FEATURE-D / TICKET-D.4). */

import type { MapEventItem } from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";

export const MAP_PAGE_TITLE = "Carte des événements";
export const MAP_PAGE_SUBTITLE =
  "Découvrez les moments locaux à venir — sans fil ni présence en direct.";
export const MAP_LOADING = "Chargement de la carte…";
export const MAP_ERROR = "Impossible de charger la carte. Réessayez plus tard.";
export const MAP_RETRY = "Réessayer";
export const MAP_EMPTY = "Aucun événement à proximité";
export const MAP_EMPTY_HINT = "Déplacez la carte ou revenez plus tard.";
export const MAP_RECENTER = (city: string): string => `Revenir à ${city}`;
export const MAP_TOKEN_MISSING =
  "Carte indisponible : configurez NEXT_PUBLIC_MAPBOX_TOKEN.";
export const MAP_VIEW_EVENT = "Voir l’événement";
export const MAP_TRUNCATED_HINT =
  "Beaucoup d’événements dans cette zone — zoomez pour affiner.";

export const MAP_BBOX_CHANGE_TOLERANCE = 0.01;

export function hasBboxChangedSignificantly(
  previous: { lat_min: number; lon_min: number; lat_max: number; lon_max: number } | null,
  next: { lat_min: number; lon_min: number; lat_max: number; lon_max: number },
  tolerance = MAP_BBOX_CHANGE_TOLERANCE,
): boolean {
  if (!previous) return true;
  return (
    Math.abs(previous.lat_min - next.lat_min) > tolerance ||
    Math.abs(previous.lat_max - next.lat_max) > tolerance ||
    Math.abs(previous.lon_min - next.lon_min) > tolerance ||
    Math.abs(previous.lon_max - next.lon_max) > tolerance
  );
}

export function boundsToMapBbox(bounds: {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
}): { lat_min: number; lon_min: number; lat_max: number; lon_max: number } {
  return {
    lat_min: bounds.getSouth(),
    lat_max: bounds.getNorth(),
    lon_min: bounds.getWest(),
    lon_max: bounds.getEast(),
  };
}

export function mapEventPopupDate(event: MapEventItem): string {
  return formatEventDateRange(event.starts_at, event.ends_at);
}

export function mapEventPopupLocation(event: MapEventItem): string {
  const district = event.neighborhood_summary?.display_name ?? event.district;
  if (district) {
    return `${event.location_name} · ${district}`;
  }
  return `${event.location_name} · ${event.city}`;
}
