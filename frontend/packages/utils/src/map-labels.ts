/** Event map UI micro-copy (FEATURE-D / WEB-MAP-01, WEB-MAP-02). */

import type { MapEventItem, TransitDeparture, TransitStopNearby } from "@yunicity/types";

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

export const MAP_RAIL_LIVE_TITLE = "En ce moment à Reims";
export const MAP_RAIL_LIVE_EMPTY = "Aucune activité mise en avant actuellement à Reims.";
export const MAP_RAIL_TRANSIT_TITLE = "Transports à proximité";
export const MAP_TRANSIT_EMPTY = "Le réseau reste calme actuellement autour du centre-ville.";
export const MAP_TRANSIT_EMPTY_ALT = "Peu de passages circulent actuellement dans ce secteur.";
export const MAP_TRANSIT_ERROR = "Horaires indisponibles pour le moment.";
export const MAP_TRANSIT_VIEW_SCHEDULES = "Voir les horaires";
export const MAP_TRANSIT_STATUS_FLUIDE = "Fluide";
export const MAP_TRANSIT_NEARBY_MINUTES = 45;
export const MAP_TRANSIT_CONTEXT_MAX_MINUTES = 360;

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

function isValidTransitMinutes(minutes: number | null | undefined): minutes is number {
  return typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0;
}

function parisDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Paris",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function formatTransitClockTime(scheduledAt: string): string | null {
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Paris",
  }).format(date);
}

function formatTransitScheduledTime(scheduledAt: string): string | null {
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  if (parisDateKey(date) !== parisDateKey(now)) return null;
  return formatTransitClockTime(scheduledAt);
}

export function formatContextualTransitTime(departure: TransitDeparture): string | null {
  if (isValidTransitMinutes(departure.minutes)) {
    if (departure.minutes <= MAP_TRANSIT_NEARBY_MINUTES) {
      return `${departure.minutes} min`;
    }
    if (departure.minutes > MAP_TRANSIT_CONTEXT_MAX_MINUTES) {
      return null;
    }
    return formatTransitClockTime(departure.scheduled_at);
  }
  return formatTransitScheduledTime(departure.scheduled_at);
}

export function formatTransitDepartureMinutes(departures: TransitDeparture[]): string {
  const labels = departures
    .map((departure) => formatContextualTransitTime(departure))
    .filter((label): label is string => Boolean(label));
  return labels.join(" · ");
}

export function groupTransitDeparturesByRoute(
  departures: TransitDeparture[],
): Map<string, TransitDeparture[]> {
  const groups = new Map<string, TransitDeparture[]>();
  for (const dep of departures) {
    if (!formatContextualTransitTime(dep)) {
      continue;
    }
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

export type TransitCarouselItem = {
  id: string;
  routeShortName: string;
  routeType: string;
  stopName: string;
  headsign: string | null;
  departureLabel: string;
};

/** Lignes utiles pour un rail horizontal (même logique que le panneau transports). */
export function buildTransitCarouselItems(
  stops: TransitStopNearby[] | undefined,
): TransitCarouselItem[] {
  if (!stops?.length) return [];

  const items: TransitCarouselItem[] = [];
  for (const stop of stops) {
    const byRoute = groupTransitDeparturesByRoute(stop.departures);
    for (const [routeKey, departures] of byRoute.entries()) {
      const sample = departures[0];
      if (!sample) continue;
      const departureLabel = formatTransitDepartureMinutes(departures);
      if (!departureLabel) continue;
      items.push({
        id: `${stop.stop_id}-${routeKey}`,
        routeShortName: sample.route_short_name,
        routeType: sample.route_type,
        stopName: stop.name,
        headsign: sample.headsign || null,
        departureLabel,
      });
    }
  }
  return items;
}

export const MAP_RAIL_CULTURE_TITLE = "Lieux culturels";
export const MAP_RAIL_CULTURE_EMPTY = "Aucun lieu culturel à afficher pour le moment.";
export const MAP_RAIL_NEIGHBORHOODS_TITLE = "Quartiers à explorer";
export const MAP_RAIL_NEIGHBORHOODS_EMPTY = "Les quartiers de votre ville arrivent progressivement.";
export const MAP_RAIL_PRIVILEGES_TITLE = "Privilèges proches";

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
