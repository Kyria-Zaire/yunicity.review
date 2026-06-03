import type { AdminCockpitSummaryParams, AdminCockpitSummaryResponse } from "@yunicity/types";
import { ApiClientBase, type AuthClient } from "@yunicity/utils";

function buildSummaryQuery(params?: AdminCockpitSummaryParams): string {
  if (!params?.city) {
    return "";
  }
  const search = new URLSearchParams();
  search.set("city", params.city);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class AdminCockpitApi extends ApiClientBase {
  getSummary(params?: AdminCockpitSummaryParams): Promise<AdminCockpitSummaryResponse> {
    return this.getJson<AdminCockpitSummaryResponse>(
      `/admin/cockpit/summary${buildSummaryQuery(params)}`,
    );
  }
}

export function createAdminCockpitApi(client: AuthClient, apiBaseUrl: string): AdminCockpitApi {
  return new AdminCockpitApi(client, apiBaseUrl);
}

export const adminCockpitApi = {
  getSummary: (api: AdminCockpitApi, params?: AdminCockpitSummaryParams) =>
    api.getSummary(params),
};
