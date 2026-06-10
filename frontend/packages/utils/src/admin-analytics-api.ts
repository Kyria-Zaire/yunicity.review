import type {
  AdminAnalyticsSummary,
  AdminAnalyticsSummaryParams,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildAnalyticsSummaryQuery(params?: AdminAnalyticsSummaryParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.city) {
    search.set("city", params.city);
  }
  if (params.period) {
    search.set("period", params.period);
  }
  if (params.compare !== undefined) {
    search.set("compare", String(params.compare));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class AdminAnalyticsApi extends ApiClientBase {
  getSummary(params?: AdminAnalyticsSummaryParams): Promise<AdminAnalyticsSummary> {
    return this.getJson<AdminAnalyticsSummary>(
      `/admin/analytics/summary${buildAnalyticsSummaryQuery(params)}`,
    );
  }
}

export function createAdminAnalyticsApi(
  client: AuthClient,
  apiBaseUrl: string,
): AdminAnalyticsApi {
  return new AdminAnalyticsApi(client, apiBaseUrl);
}
