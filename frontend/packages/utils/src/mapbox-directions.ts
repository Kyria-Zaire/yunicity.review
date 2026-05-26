import type { MapRouteGeometry, MapRouteSummary } from "@yunicity/types";

export type MapRouteProfile = "walking" | "driving" | "cycling";

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

const PROFILE_PATH: Record<MapRouteProfile, string> = {
  walking: "walking",
  driving: "driving",
  cycling: "cycling",
};

export async function fetchMapboxRoute(params: {
  accessToken: string;
  profile?: MapRouteProfile;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}): Promise<DirectionsResult> {
  const { accessToken, origin, destination } = params;
  const profile = params.profile ?? "walking";
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${PROFILE_PATH[profile]}/${coordinates}`,
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

/** @deprecated Prefer fetchMapboxRoute with profile. */
export async function fetchMapboxWalkingRoute(params: {
  accessToken: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}): Promise<DirectionsResult> {
  return fetchMapboxRoute({ ...params, profile: "walking" });
}
