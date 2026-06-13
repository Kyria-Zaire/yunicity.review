import type {
  NeighborhoodContextResponse,
  NeighborhoodDetail,
  NeighborhoodListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class NeighborhoodsApi extends ApiClientBase {
  listNeighborhoods(params: {
    city: string;
    featured_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<NeighborhoodListResponse> {
    const search = new URLSearchParams();
    search.set("city", params.city);
    if (params.featured_only) {
      search.set("featured_only", "true");
    }
    if (params.page) {
      search.set("page", String(params.page));
    }
    if (params.page_size) {
      search.set("page_size", String(params.page_size));
    }
    return this.getJson<NeighborhoodListResponse>(`/neighborhoods?${search.toString()}`);
  }

  getNeighborhood(slug: string, city: string): Promise<NeighborhoodDetail> {
    const qs = new URLSearchParams({ city });
    return this.getJson<NeighborhoodDetail>(
      `/neighborhoods/${encodeURIComponent(slug)}?${qs.toString()}`,
    );
  }

  getNeighborhoodContext(slug: string, city: string): Promise<NeighborhoodContextResponse> {
    const qs = new URLSearchParams({ city });
    return this.getJson<NeighborhoodContextResponse>(
      `/neighborhoods/${encodeURIComponent(slug)}/context?${qs.toString()}`,
    );
  }
}

export function createNeighborhoodsApi(client: AuthClient, apiBaseUrl: string): NeighborhoodsApi {
  return new NeighborhoodsApi(client, apiBaseUrl);
}
