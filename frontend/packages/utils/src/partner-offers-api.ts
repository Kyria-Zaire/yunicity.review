import type {
  PartnerOfferCreatePayload,
  PartnerOfferManagementListParams,
  PartnerOfferManagement,
  PartnerOfferManagementListResponse,
  PartnerOfferUpdatePayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: PartnerOfferManagementListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.offer_type) {
    search.set("offer_type", params.offer_type);
  }
  if (params.organization_id) {
    search.set("organization_id", params.organization_id);
  }
  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.page_size !== undefined) {
    search.set("page_size", String(params.page_size));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class PartnerOffersApi extends ApiClientBase {
  listOffers(params?: PartnerOfferManagementListParams): Promise<PartnerOfferManagementListResponse> {
    return this.getJson<PartnerOfferManagementListResponse>(
      `/organizations/me/offers${buildListQuery(params)}`,
    );
  }

  createOffer(payload: PartnerOfferCreatePayload): Promise<PartnerOfferManagement> {
    return this.postJson<PartnerOfferManagement>("/organizations/me/offers", payload);
  }

  updateOffer(id: string, payload: PartnerOfferUpdatePayload): Promise<PartnerOfferManagement> {
    return this.patchJson<PartnerOfferManagement>(
      `/organizations/me/offers/${encodeURIComponent(id)}`,
      payload,
    );
  }

  submitOffer(id: string): Promise<PartnerOfferManagement> {
    return this.postJson<PartnerOfferManagement>(
      `/organizations/me/offers/${encodeURIComponent(id)}/submit`,
      {},
    );
  }
}

export function createPartnerOffersApi(
  client: AuthClient,
  apiBaseUrl: string,
): PartnerOffersApi {
  return new PartnerOffersApi(client, apiBaseUrl);
}
