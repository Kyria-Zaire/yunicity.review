import type { SearchListParams, SearchResponse } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";
import { searchTypeToApiParam } from "./search-labels";

export function buildSearchQuery(params: SearchListParams): string {
  const search = new URLSearchParams();
  search.set("q", params.q);
  const entries: [string, string | number | undefined | null][] = [
    ["city", params.city],
    ["neighborhood_slug", params.neighborhood_slug],
    ["type", params.type ? searchTypeToApiParam(params.type) : undefined],
    ["period", params.period],
    ["page", params.page],
    ["limit", params.limit],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  return `?${search.toString()}`;
}

export class SearchApi extends ApiClientBase {
  search(params: SearchListParams): Promise<SearchResponse> {
    return this.getJson<SearchResponse>(`/search${buildSearchQuery(params)}`);
  }
}

export function createSearchApi(client: AuthClient, apiBaseUrl: string): SearchApi {
  return new SearchApi(client, apiBaseUrl);
}
