import type {
  AdminCreatorContentActionListResponse,
  PartnerCreatorContentAdmin,
  PartnerCreatorContentAdminActionListParams,
  PartnerCreatorContentAdminListParams,
  PartnerCreatorContentAdminListResponse,
  PartnerCreatorContentAdminSummaryParams,
  PartnerCreatorContentAdminSummaryResponse,
  PartnerCreatorContentRejectPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: PartnerCreatorContentAdminListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.city) {
    search.set("city", params.city);
  }
  if (params.organization_id) {
    search.set("organization_id", params.organization_id);
  }
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.sort) {
    search.set("sort", params.sort);
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

function buildPagedQuery(params?: PartnerCreatorContentAdminActionListParams): string {
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

function buildSummaryQuery(params?: PartnerCreatorContentAdminSummaryParams): string {
  if (!params?.city) {
    return "";
  }
  const search = new URLSearchParams();
  search.set("city", params.city);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class PartnerCreatorContentAdminApi extends ApiClientBase {
  getSummary(
    params?: PartnerCreatorContentAdminSummaryParams,
  ): Promise<PartnerCreatorContentAdminSummaryResponse> {
    return this.getJson<PartnerCreatorContentAdminSummaryResponse>(
      `/admin/partner-creator-content/summary${buildSummaryQuery(params)}`,
    );
  }

  listContents(
    params?: PartnerCreatorContentAdminListParams,
  ): Promise<PartnerCreatorContentAdminListResponse> {
    return this.getJson<PartnerCreatorContentAdminListResponse>(
      `/admin/partner-creator-content${buildListQuery(params)}`,
    );
  }

  getContent(id: string): Promise<PartnerCreatorContentAdmin> {
    return this.getJson<PartnerCreatorContentAdmin>(
      `/admin/partner-creator-content/${encodeURIComponent(id)}`,
    );
  }

  approveContent(id: string): Promise<PartnerCreatorContentAdmin> {
    return this.postJson<PartnerCreatorContentAdmin>(
      `/admin/partner-creator-content/${encodeURIComponent(id)}/approve`,
      {},
    );
  }

  rejectContent(id: string, payload: PartnerCreatorContentRejectPayload): Promise<PartnerCreatorContentAdmin> {
    return this.postJson<PartnerCreatorContentAdmin>(
      `/admin/partner-creator-content/${encodeURIComponent(id)}/reject`,
      payload,
    );
  }

  archiveContent(id: string): Promise<PartnerCreatorContentAdmin> {
    return this.postJson<PartnerCreatorContentAdmin>(
      `/admin/partner-creator-content/${encodeURIComponent(id)}/archive`,
      {},
    );
  }

  listContentActions(
    contentId: string,
    params?: PartnerCreatorContentAdminActionListParams,
  ): Promise<AdminCreatorContentActionListResponse> {
    return this.getJson<AdminCreatorContentActionListResponse>(
      `/admin/partner-creator-content/${encodeURIComponent(contentId)}/actions${buildPagedQuery(params)}`,
    );
  }
}

export function createPartnerCreatorContentAdminApi(
  client: AuthClient,
  apiBaseUrl: string,
): PartnerCreatorContentAdminApi {
  return new PartnerCreatorContentAdminApi(client, apiBaseUrl);
}
