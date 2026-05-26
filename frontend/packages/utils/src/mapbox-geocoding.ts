/** Mapbox Geocoding API (client-side, WEB-MAP-03B). */

export type GeocodeResult =
  | { ok: true; latitude: number; longitude: number; placeName: string }
  | { ok: false };

type MapboxGeocodeResponse = {
  features?: Array<{
    center?: [number, number];
    place_name?: string;
  }>;
};

export async function geocodeMapboxAddress(params: {
  accessToken: string;
  query: string;
  proximity?: { latitude: number; longitude: number };
}): Promise<GeocodeResult> {
  const trimmed = params.query.trim();
  if (!trimmed) {
    return { ok: false };
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  );
  url.searchParams.set("access_token", params.accessToken);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "fr");
  url.searchParams.set("country", "fr");
  if (params.proximity) {
    url.searchParams.set(
      "proximity",
      `${params.proximity.longitude},${params.proximity.latitude}`,
    );
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { ok: false };
    }
    const data = (await response.json()) as MapboxGeocodeResponse;
    const feature = data.features?.[0];
    const center = feature?.center;
    if (!center || center.length < 2) {
      return { ok: false };
    }
    return {
      ok: true,
      longitude: center[0],
      latitude: center[1],
      placeName: feature.place_name ?? trimmed,
    };
  } catch {
    return { ok: false };
  }
}
