import type {
  CulturalPlaceDetail,
  CulturalPlaceListResponse,
  MapCulturalPlaceListResponse,
  MapCulturalPlacesListParams,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export function buildCulturalPlacesQuery(params: {
  city: string;
  featured?: boolean;
  limit?: number;
}): string {
  const search = new URLSearchParams();
  search.set("city", params.city);
  if (params.featured !== undefined) {
    search.set("featured", String(params.featured));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  return `?${search.toString()}`;
}

export function buildMapCulturalPlacesQuery(params: MapCulturalPlacesListParams): string {
  const search = new URLSearchParams();
  search.set("lat_min", String(params.lat_min));
  search.set("lon_min", String(params.lon_min));
  search.set("lat_max", String(params.lat_max));
  search.set("lon_max", String(params.lon_max));
  search.set("city", params.city);
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  return `?${search.toString()}`;
}

export class CulturalPlacesApi extends ApiClientBase {
  listPlaces(params: {
    city: string;
    featured?: boolean;
    limit?: number;
  }): Promise<CulturalPlaceListResponse> {
    return this.getJson<CulturalPlaceListResponse>(
      `/cultural-places${buildCulturalPlacesQuery(params)}`,
    );
  }

  getPlace(slug: string, city: string): Promise<CulturalPlaceDetail> {
    const search = new URLSearchParams({ city });
    return this.getJson<CulturalPlaceDetail>(`/cultural-places/${slug}?${search.toString()}`);
  }

  listMapPlaces(params: MapCulturalPlacesListParams): Promise<MapCulturalPlaceListResponse> {
    return this.getJson<MapCulturalPlaceListResponse>(
      `/map/cultural-places${buildMapCulturalPlacesQuery(params)}`,
    );
  }
}

export function createCulturalPlacesApi(client: AuthClient, apiBaseUrl: string): CulturalPlacesApi {
  return new CulturalPlacesApi(client, apiBaseUrl);
}
