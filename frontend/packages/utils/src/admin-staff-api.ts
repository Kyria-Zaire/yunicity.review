import type {
  AdminStaffActionListParams,
  AdminStaffActionListResponse,
  AdminStaffAssignRolePayload,
  AdminStaffDetailResponse,
  AdminStaffListParams,
  AdminStaffListResponse,
  AdminStaffReasonPayload,
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

  assignRole(
    staffId: string,
    payload: AdminStaffAssignRolePayload,
  ): Promise<AdminStaffDetailResponse> {
    return this.postJson<AdminStaffDetailResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}/roles`,
      payload,
    );
  }

  revokeRole(
    staffId: string,
    role: string,
    _payload?: AdminStaffReasonPayload,
  ): Promise<AdminStaffDetailResponse> {
    return this.deleteJson<AdminStaffDetailResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}/roles/${encodeURIComponent(role)}`,
    );
  }

  suspendStaff(
    staffId: string,
    payload: AdminStaffReasonPayload = {},
  ): Promise<AdminStaffDetailResponse> {
    return this.postJson<AdminStaffDetailResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}/suspend`,
      payload,
    );
  }

  reactivateStaff(
    staffId: string,
    payload: AdminStaffReasonPayload = {},
  ): Promise<AdminStaffDetailResponse> {
    return this.postJson<AdminStaffDetailResponse>(
      `/admin/staff/${encodeURIComponent(staffId)}/reactivate`,
      payload,
    );
  }

  private async deleteJson<T>(segment: string): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "DELETE" });
    return this.readJson<T>(response);
  }
}

export function createAdminStaffApi(client: AuthClient, apiBaseUrl: string): AdminStaffApi {
  return new AdminStaffApi(client, apiBaseUrl);
}
