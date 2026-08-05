/** Default map centers per city (FEATURE-D). */

import type { MapBbox } from "@yunicity/types";

export const DEFAULT_MAP_CITY = "Reims";

/**
 * Demi-côté (en degrés) du bbox de chargement unique d'une ville (T5).
 * 0.2° => bbox 0.4°×0.4° = 0.16 deg², SOUS le garde-fou serveur MAP_BBOX_MAX_SURFACE_DEG2 (0.25,
 * cf. backend/app/core/map_constants.py) qui renvoie 422 BBOX_TOO_LARGE au-delà. Couvre largement
 * une ville (~44 km × ~29 km à la latitude de Reims).
 * TODO(debt): fenêtre fixe — une ville plus étendue que ~0.4° serait tronquée (comme le plafond
 * `limit` serveur). À revisiter en multi-ville / gros volumes par un chargement borné ou paginé.
 */
const CITY_LOAD_BBOX_HALF_DEG = 0.2;

export type CityMapCenter = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export const CITY_MAP_CENTERS: Record<string, CityMapCenter> = {
  Reims: { latitude: 49.2583, longitude: 4.0317, zoom: 12 },
};

export function resolveCityMapCenter(city: string): CityMapCenter {
  const key = Object.keys(CITY_MAP_CENTERS).find(
    (name) => name.toLowerCase() === city.trim().toLowerCase(),
  );
  if (key) return CITY_MAP_CENTERS[key]!;
  return CITY_MAP_CENTERS[DEFAULT_MAP_CITY]!;
}

/**
 * Bbox de chargement unique centré sur la ville (T5). Reste sous le garde-fou serveur
 * MAP_BBOX_MAX_SURFACE_DEG2 (0.25 deg²) — un bbox « monde » déclenchait 422 BBOX_TOO_LARGE et
 * cassait le fetch events. Le backend filtre en plus par `city`, ce bbox borne juste la surface.
 */
export function resolveCityLoadBbox(city: string): MapBbox {
  const center = resolveCityMapCenter(city);
  return {
    lat_min: center.latitude - CITY_LOAD_BBOX_HALF_DEG,
    lat_max: center.latitude + CITY_LOAD_BBOX_HALF_DEG,
    lon_min: center.longitude - CITY_LOAD_BBOX_HALF_DEG,
    lon_max: center.longitude + CITY_LOAD_BBOX_HALF_DEG,
  };
}
