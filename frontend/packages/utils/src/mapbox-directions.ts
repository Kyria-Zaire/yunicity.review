import type { MapRouteGeometry, MapRouteSummary } from "@yunicity/types";

type DirectionsResult =
  | { ok: true; summary: MapRouteSummary; geometry: MapRouteGeometry }
  | { ok: false };

type MapboxDirectionsResponse = {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: MapRouteGeometry;
  }>;
};

export async function fetchMapboxWalkingRoute(params: {
  accessToken: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}): Promise<DirectionsResult> {
  const { accessToken, origin, destination } = params;
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}`,
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { ok: false };
    }
    const data = (await response.json()) as MapboxDirectionsResponse;
    const route = data.routes?.[0];
    if (!route?.geometry || route.distance === undefined || route.duration === undefined) {
      return { ok: false };
    }
    return {
      ok: true,
      summary: {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      },
      geometry: route.geometry,
    };
  } catch {
    return { ok: false };
  }
}
