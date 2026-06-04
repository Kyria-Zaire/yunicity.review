import type {
  AdminPartnerOfferActionListResponse,
  PartnerOfferAdmin,
  PartnerOfferAdminActionListParams,
  PartnerOfferAdminCreatePayload,
  PartnerOfferAdminListParams,
  PartnerOfferAdminListResponse,
  PartnerOfferAdminRedemptionListParams,
  PartnerOfferAdminRedemptionListResponse,
  PartnerOfferAdminUpdatePayload,
  PartnerOfferRejectPayload,
  VerifiedOrganizationListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: PartnerOfferAdminListParams): string {
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

function buildPagedQuery(
  params?: PartnerOfferAdminRedemptionListParams | PartnerOfferAdminActionListParams,
): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.page_size !== undefined) {
    search.set("page_size", String(params.page_size));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class PartnerOffersAdminApi extends ApiClientBase {
  listVerifiedOrganizations(): Promise<VerifiedOrganizationListResponse> {
    return this.getJson<VerifiedOrganizationListResponse>(
      "/admin/partner-offers/verified-organizations",
    );
  }

  listOffers(params?: PartnerOfferAdminListParams): Promise<PartnerOfferAdminListResponse> {
    return this.getJson<PartnerOfferAdminListResponse>(
      `/admin/partner-offers${buildListQuery(params)}`,
    );
  }

  getOffer(id: string): Promise<PartnerOfferAdmin> {
    return this.getJson<PartnerOfferAdmin>(`/admin/partner-offers/${encodeURIComponent(id)}`);
  }

  createOffer(payload: PartnerOfferAdminCreatePayload): Promise<PartnerOfferAdmin> {
    return this.postJson<PartnerOfferAdmin>("/admin/partner-offers", payload);
  }

  updateOffer(id: string, payload: PartnerOfferAdminUpdatePayload): Promise<PartnerOfferAdmin> {
    return this.patchJson<PartnerOfferAdmin>(
      `/admin/partner-offers/${encodeURIComponent(id)}`,
      payload,
    );
  }

  approveOffer(id: string): Promise<PartnerOfferAdmin> {
    return this.postJson<PartnerOfferAdmin>(
      `/admin/partner-offers/${encodeURIComponent(id)}/approve`,
      {},
    );
  }

  rejectOffer(id: string, payload: PartnerOfferRejectPayload): Promise<PartnerOfferAdmin> {
    return this.postJson<PartnerOfferAdmin>(
      `/admin/partner-offers/${encodeURIComponent(id)}/reject`,
      payload,
    );
  }

  archiveOffer(id: string): Promise<PartnerOfferAdmin> {
    return this.postJson<PartnerOfferAdmin>(
      `/admin/partner-offers/${encodeURIComponent(id)}/archive`,
      {},
    );
  }

  listOfferRedemptions(
    offerId: string,
    params?: PartnerOfferAdminRedemptionListParams,
  ): Promise<PartnerOfferAdminRedemptionListResponse> {
    return this.getJson<PartnerOfferAdminRedemptionListResponse>(
      `/admin/partner-offers/${encodeURIComponent(offerId)}/redemptions${buildPagedQuery(params)}`,
    );
  }

  listOfferActions(
    offerId: string,
    params?: PartnerOfferAdminActionListParams,
  ): Promise<AdminPartnerOfferActionListResponse> {
    return this.getJson<AdminPartnerOfferActionListResponse>(
      `/admin/partner-offers/${encodeURIComponent(offerId)}/actions${buildPagedQuery(params)}`,
    );
  }
}

export function createPartnerOffersAdminApi(
  client: AuthClient,
  apiBaseUrl: string,
): PartnerOffersAdminApi {
  return new PartnerOffersAdminApi(client, apiBaseUrl);
}
