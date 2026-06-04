import type {
  AdminPassportListParams,
  AdminPassportListResponse,
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

export class AdminPassportsApi extends ApiClientBase {
  listPassports(params?: AdminPassportListParams): Promise<AdminPassportListResponse> {
    return this.getJson<AdminPassportListResponse>(`/admin/passports${buildListQuery(params)}`);
  }
}

export function createAdminPassportsApi(client: AuthClient, apiBaseUrl: string): AdminPassportsApi {
  return new AdminPassportsApi(client, apiBaseUrl);
}
