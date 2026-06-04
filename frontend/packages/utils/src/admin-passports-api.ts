import type {
  AdminPassportActionListResponse,
  AdminPassportDetailResponse,
  AdminPassportListParams,
  AdminPassportListResponse,
  AdminPassportRedemptionListResponse,
  AdminPassportStampListResponse,
  AdminPassportStatusPatchPayload,
  AdminPassportSubresourceListParams,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: AdminPassportListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.city?.trim()) {
    search.set("city", params.city.trim());
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.search_mode) {
    search.set("search_mode", params.search_mode);
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

function buildSubresourceQuery(params?: AdminPassportSubresourceListParams): string {
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

export class AdminPassportsApi extends ApiClientBase {
  listPassports(params?: AdminPassportListParams): Promise<AdminPassportListResponse> {
    return this.getJson<AdminPassportListResponse>(`/admin/passports${buildListQuery(params)}`);
  }

  getPassportDetail(passportId: string): Promise<AdminPassportDetailResponse> {
    return this.getJson<AdminPassportDetailResponse>(
      `/admin/passports/${encodeURIComponent(passportId)}`,
    );
  }

  listPassportStamps(
    passportId: string,
    params?: AdminPassportSubresourceListParams,
  ): Promise<AdminPassportStampListResponse> {
    return this.getJson<AdminPassportStampListResponse>(
      `/admin/passports/${encodeURIComponent(passportId)}/stamps${buildSubresourceQuery(params)}`,
    );
  }

  listPassportRedemptions(
    passportId: string,
    params?: AdminPassportSubresourceListParams,
  ): Promise<AdminPassportRedemptionListResponse> {
    return this.getJson<AdminPassportRedemptionListResponse>(
      `/admin/passports/${encodeURIComponent(passportId)}/redemptions${buildSubresourceQuery(params)}`,
    );
  }

  listPassportActions(
    passportId: string,
    params?: AdminPassportSubresourceListParams,
  ): Promise<AdminPassportActionListResponse> {
    return this.getJson<AdminPassportActionListResponse>(
      `/admin/passports/${encodeURIComponent(passportId)}/actions${buildSubresourceQuery(params)}`,
    );
  }

  patchPassportStatus(
    passportId: string,
    payload: AdminPassportStatusPatchPayload,
  ): Promise<AdminPassportDetailResponse> {
    return this.patchJson<AdminPassportDetailResponse>(
      `/admin/passports/${encodeURIComponent(passportId)}`,
      payload,
    );
  }
}

export function createAdminPassportsApi(client: AuthClient, apiBaseUrl: string): AdminPassportsApi {
  return new AdminPassportsApi(client, apiBaseUrl);
}
