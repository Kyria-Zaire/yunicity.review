import type { TransitNearbyParams, TransitNearbyResponse } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export function buildTransitNearbyQuery(params: TransitNearbyParams): string {
  const search = new URLSearchParams();
  search.set("lat", String(params.lat));
  search.set("lon", String(params.lon));
  if (params.city !== undefined) {
    search.set("city", params.city);
  }
  if (params.radius_meters !== undefined) {
    search.set("radius_meters", String(params.radius_meters));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.max_minutes !== undefined) {
    search.set("max_minutes", String(params.max_minutes));
  }
  return `?${search.toString()}`;
}

export class TransitApi extends ApiClientBase {
  getNearby(params: TransitNearbyParams): Promise<TransitNearbyResponse> {
    return this.getJson<TransitNearbyResponse>(`/transit/nearby${buildTransitNearbyQuery(params)}`);
  }
}

export function createTransitApi(client: AuthClient, apiBaseUrl: string): TransitApi {
  return new TransitApi(client, apiBaseUrl);
}
