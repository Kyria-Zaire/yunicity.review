import type {
  AdminOrganizationListParams,
  AdminOrganizationListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: AdminOrganizationListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.city?.trim()) {
    search.set("city", params.city.trim());
  }
  if (params.verification_status) {
    search.set("verification_status", params.verification_status);
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

export class AdminOrganizationsApi extends ApiClientBase {
  listOrganizations(params?: AdminOrganizationListParams): Promise<AdminOrganizationListResponse> {
    return this.getJson<AdminOrganizationListResponse>(
      `/admin/organizations${buildListQuery(params)}`,
    );
  }
}

export function createAdminOrganizationsApi(
  client: AuthClient,
  apiBaseUrl: string,
): AdminOrganizationsApi {
  return new AdminOrganizationsApi(client, apiBaseUrl);
}
