/** Event map UI micro-copy (FEATURE-D / WEB-MAP-01, WEB-MAP-02). */

import type { MapEventItem, TransitDeparture } from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";

export const MAP_PAGE_TITLE = "Carte";
export const MAP_PAGE_SUBTITLE =
  "Explorez Reims — moments, lieux et quartiers, sans présence en direct.";
export const MAP_SEARCH_PLACEHOLDER = (city: string): string => `Rechercher à ${city}…`;
export const MAP_NEARBY_TITLE = "Moments à proximité";
export const MAP_NEARBY_EMPTY = "Aucun moment visible dans cette zone pour le moment.";
export const MAP_NEARBY_EMPTY_HINT = "Déplacez la carte ou consultez la liste complète.";
export const MAP_NEARBY_VIEW_ALL = "Tout voir";
export const MAP_OFFER_TITLE = "Privilège à proximité";
export const MAP_OFFER_EMPTY = "Les offres Passport de vos commerces apparaîtront ici.";
export const MAP_OFFER_CTA = "Ouvrir mon Passport";

export const MAP_RAIL_URBAN_TITLE = "Parcours urbains";
export const MAP_RAIL_TRANSIT_TITLE = "Transports à proximité";
export const MAP_TRANSIT_EMPTY = "Aucun passage proche trouvé.";
export const MAP_TRANSIT_ERROR = "Horaires indisponibles pour le moment.";
export const MAP_TRANSIT_VIEW_SCHEDULES = "Voir les horaires";
export const MAP_TRANSIT_STATUS_FLUIDE = "Fluide";

export function transitRouteIcon(routeType: string): string {
  if (routeType === "tram") return "🚋";
  if (routeType === "bus" || routeType === "trolleybus") return "🚌";
  return "🚏";
}

export function transitRouteLabel(routeType: string, shortName: string): string {
  const kind =
    routeType === "tram" ? "Tram" : routeType === "bus" ? "Ligne" : "Ligne";
  return `${kind} ${shortName}`;
}

export function formatTransitDepartureMinutes(departures: TransitDeparture[]): string {
  return departures.map((d) => `${d.minutes} min`).join(" · ");
}

export function groupTransitDeparturesByRoute(
  departures: TransitDeparture[],
): Map<string, TransitDeparture[]> {
  const groups = new Map<string, TransitDeparture[]>();
  for (const dep of departures) {
    const key = `${dep.route_type}:${dep.route_short_name}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(dep);
    } else {
      groups.set(key, [dep]);
    }
  }
  return groups;
}
export const MAP_RAIL_URBAN_SOON = "Bientôt disponible";
export const MAP_RAIL_CULTURE_TITLE = "Lieux culturels";
export const MAP_RAIL_CULTURE_EMPTY = "Aucun lieu culturel à afficher pour le moment.";
export const MAP_RAIL_NEIGHBORHOODS_TITLE = "Quartiers à explorer";
export const MAP_RAIL_NEIGHBORHOODS_EMPTY = "Les quartiers de votre ville arrivent progressivement.";
export const MAP_RAIL_PRIVILEGES_TITLE = "Privilèges proches";

/** Parcours éditoriaux statiques — pas de backend, pas de compteurs live. */
export const MAP_EDITORIAL_ROUTES = [
  { id: "art-deco", title: "Balade Art Déco", duration: "45 min", difficulty: "Facile" },
  { id: "remparts", title: "Trace des remparts", duration: "30 min", difficulty: "Facile" },
] as const;

export const MAP_LOADING = "Chargement de la carte…";
export const MAP_ERROR = "Impossible de charger la carte. Réessayez plus tard.";
export const MAP_RETRY = "Réessayer";
export const MAP_EMPTY = "Aucun événement à proximité";
export const MAP_EMPTY_HINT = "Déplacez la carte ou revenez plus tard.";
export const MAP_RECENTER = (city: string): string => `Revenir à ${city}`;
export const MAP_TOKEN_MISSING =
  "Carte indisponible : token Mapbox public manquant.";
export const MAP_TOKEN_MISSING_WEB =
  "Carte indisponible : configurez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.";
export const MAP_TOKEN_MISSING_EXPO =
  "Carte indisponible : configurez EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.";
export const MAP_VIEW_EVENT = "Voir le moment";
export const MAP_VIEW_ON_MAP = "Centrer sur la carte";
export const MAP_TRUNCATED_HINT =
  "Beaucoup de moments dans cette zone — zoomez pour affiner.";

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
