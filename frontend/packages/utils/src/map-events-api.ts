import type { MapEventsListParams, MapEventListResponse } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export function buildMapEventsQuery(params: MapEventsListParams): string {
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

export class MapEventsApi extends ApiClientBase {
  listEvents(params: MapEventsListParams): Promise<MapEventListResponse> {
    return this.getJson<MapEventListResponse>(`/map/events${buildMapEventsQuery(params)}`);
  }
}

export function createMapEventsApi(client: AuthClient, apiBaseUrl: string): MapEventsApi {
  return new MapEventsApi(client, apiBaseUrl);
}
