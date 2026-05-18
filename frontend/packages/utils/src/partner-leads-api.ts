import type {
  ConvertLeadPayload,
  PartnerLead,
  PartnerLeadListParams,
  PartnerLeadListResponse,
  PartnerLeadUpdatePayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: PartnerLeadListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.source) {
    search.set("source", params.source);
  }
  if (params.city?.trim()) {
    search.set("city", params.city.trim());
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

export class PartnerLeadsApi extends ApiClientBase {
  listPartnerLeads(params?: PartnerLeadListParams): Promise<PartnerLeadListResponse> {
    return this.getJson<PartnerLeadListResponse>(`/partner-leads${buildListQuery(params)}`);
  }

  getPartnerLead(id: string): Promise<PartnerLead> {
    return this.getJson<PartnerLead>(`/partner-leads/${encodeURIComponent(id)}`);
  }

  updatePartnerLead(id: string, payload: PartnerLeadUpdatePayload): Promise<PartnerLead> {
    return this.patchJson<PartnerLead>(
      `/partner-leads/${encodeURIComponent(id)}`,
      payload,
    );
  }

  convertPartnerLead(id: string, payload: ConvertLeadPayload): Promise<PartnerLead> {
    return this.postJson<PartnerLead>(
      `/partner-leads/${encodeURIComponent(id)}/convert`,
      payload,
    );
  }
}

export function createPartnerLeadsApi(client: AuthClient, apiBaseUrl: string): PartnerLeadsApi {
  return new PartnerLeadsApi(client, apiBaseUrl);
}
