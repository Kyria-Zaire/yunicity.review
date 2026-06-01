import type {
  LocalEventListResponse,
  PartnerEventsParams,
  PartnerListParams,
  PartnerListResponse,
  PartnerOfferListParams,
  PartnerOfferPublicListResponse,
  PartnerPublic,
} from "@yunicity/types";

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

  listPartnerEvents(
    slug: string,
    params: PartnerEventsParams = {},
  ): Promise<LocalEventListResponse> {
    const search = new URLSearchParams();
    if (params.upcoming_only !== undefined) {
      search.set("upcoming_only", String(params.upcoming_only));
    }
    if (params.limit !== undefined) {
      search.set("limit", String(params.limit));
    }
    if (params.offset !== undefined) {
      search.set("offset", String(params.offset));
    }
    const qs = search.toString();
    return this.getJson<LocalEventListResponse>(
      `/partners/${encodeURIComponent(slug)}/events${qs ? `?${qs}` : ""}`,
    );
  }

  listPartnerOffers(
    slug: string,
    city: string,
    params: Pick<PartnerOfferListParams, "limit" | "offset"> = {},
  ): Promise<PartnerOfferPublicListResponse> {
    const search = new URLSearchParams({ city });
    if (params.limit !== undefined) {
      search.set("limit", String(params.limit));
    }
    if (params.offset !== undefined) {
      search.set("offset", String(params.offset));
    }
    return this.getJson<PartnerOfferPublicListResponse>(
      `/partners/${encodeURIComponent(slug)}/offers?${search.toString()}`,
    );
  }
}

export function createPartnersApi(client: AuthClient, apiBaseUrl: string): PartnersApi {
  return new PartnersApi(client, apiBaseUrl);
}

/** Fetch public offers without auth. */
export async function fetchPublicPartnerOffers(
  apiBaseUrl: string,
  params: PartnerOfferListParams,
): Promise<PartnerOfferPublicListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const search = new URLSearchParams({ city: params.city });
  if (params.partner_slug) search.set("partner_slug", params.partner_slug);
  if (params.featured !== undefined) search.set("featured", String(params.featured));
  if (params.type) search.set("type", params.type);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));

  const response = await fetch(`${base}/api/v1/partners/offers?${search.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const { parseApiError } = await import("./auth/auth-errors");
    throw await parseApiError(response);
  }
  return (await response.json()) as PartnerOfferPublicListResponse;
}
