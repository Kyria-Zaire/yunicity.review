import type {
  AdminStaffActionListParams,
  AdminStaffActionListResponse,
  AdminStaffDetailResponse,
  AdminStaffListParams,
  AdminStaffListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildStaffListQuery(params?: AdminStaffListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.role) {
    search.set("role", params.role);
  }
  if (params.is_active !== undefined) {
    search.set("is_active", String(params.is_active));
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

function buildStaffActionsQuery(params?: AdminStaffActionListParams): string {
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

export class AdminStaffApi extends ApiClientBase {
  listStaff(params?: AdminStaffListParams): Promise<AdminStaffListResponse> {
    return this.getJson<AdminStaffListResponse>(`/admin/staff${buildStaffListQuery(params)}`);
  }

  getStaffDetail(staffId: string): Promise<AdminStaffDetailResponse> {
    return this.getJson<AdminStaffDetailResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}`,
    );
  }

  listStaffActions(
    staffId: string,
    params?: AdminStaffActionListParams,
  ): Promise<AdminStaffActionListResponse> {
    return this.getJson<AdminStaffActionListResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}/actions${buildStaffActionsQuery(params)}`,
    );
  }
}

export function createAdminStaffApi(client: AuthClient, apiBaseUrl: string): AdminStaffApi {
  return new AdminStaffApi(client, apiBaseUrl);
}
