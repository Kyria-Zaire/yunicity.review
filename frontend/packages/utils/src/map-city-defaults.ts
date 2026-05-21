/** Default map centers per city (FEATURE-D). */

export const DEFAULT_MAP_CITY = "Reims";

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
