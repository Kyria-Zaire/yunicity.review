import type { PartnerListParams, PartnerListResponse, PartnerPublic } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export function buildPartnersQuery(params: PartnerListParams): string {
  const search = new URLSearchParams();
  search.set("city", params.city);
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.type) {
    search.set("type", params.type);
  }
  if (params.featured !== undefined) {
    search.set("featured", String(params.featured));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }
  return `?${search.toString()}`;
}

export class PartnersApi extends ApiClientBase {
  listPartners(params: PartnerListParams): Promise<PartnerListResponse> {
    return this.getJson<PartnerListResponse>(`/partners${buildPartnersQuery(params)}`);
  }

  getPartner(slug: string, city: string): Promise<PartnerPublic> {
    const search = new URLSearchParams({ city });
    return this.getJson<PartnerPublic>(`/partners/${slug}?${search.toString()}`);
  }
}

export function createPartnersApi(client: AuthClient, apiBaseUrl: string): PartnersApi {
  return new PartnersApi(client, apiBaseUrl);
}
