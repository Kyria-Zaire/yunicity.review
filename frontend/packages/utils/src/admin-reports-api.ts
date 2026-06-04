import type {
  AdminReportDetailResponse,
  AdminReportListParams,
  AdminReportListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: AdminReportListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.status !== undefined) {
    search.set("status", params.status);
  }
  if (params.reason) {
    search.set("reason", params.reason);
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

export class AdminReportsApi extends ApiClientBase {
  listReports(params?: AdminReportListParams): Promise<AdminReportListResponse> {
    return this.getJson<AdminReportListResponse>(`/admin/reports${buildListQuery(params)}`);
  }

  getReport(reportId: string): Promise<AdminReportDetailResponse> {
    return this.getJson<AdminReportDetailResponse>(
      `/admin/reports/${encodeURIComponent(reportId)}`,
    );
  }
}

export function createAdminReportsApi(client: AuthClient, apiBaseUrl: string): AdminReportsApi {
  return new AdminReportsApi(client, apiBaseUrl);
}
