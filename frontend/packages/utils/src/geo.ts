/** Geo utilities for consent-first location (WEB-SEARCH-02A). */

export type GeoPermissionState = "unknown" | "granted" | "denied" | "error";

export function permissionStateFromGeolocationError(
  err: GeolocationPositionError | unknown,
): GeoPermissionState {
  const code = (err as GeolocationPositionError | null | undefined)?.code;
  if (code === 1) return "denied"; // PERMISSION_DENIED
  if (code === 2) return "error"; // POSITION_UNAVAILABLE
  if (code === 3) return "error"; // TIMEOUT
  return "error";
}

export function shouldUseFallbackCity(permissionState: GeoPermissionState): boolean {
  return permissionState !== "granted";
}

export function resolveCityForUi(params: {
  permissionState: GeoPermissionState;
  currentCityFromGeo: string | null;
  fallbackCity: string;
}): string {
  if (params.permissionState === "granted" && params.currentCityFromGeo?.trim()) {
    return params.currentCityFromGeo.trim();
  }
  return params.fallbackCity;
}

