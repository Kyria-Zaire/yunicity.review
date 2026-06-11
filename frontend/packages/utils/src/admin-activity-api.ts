import type {
  AdminActivityFeed,
  AdminActivityFeedParams,
  AdminActivitySummary,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildActivityFeedQuery(params?: AdminActivityFeedParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }
  if (params.category) {
    search.set("category", params.category);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class AdminActivityApi extends ApiClientBase {
  getActivitySummary(): Promise<AdminActivitySummary> {
    return this.getJson<AdminActivitySummary>("/admin/activity/summary");
  }

  getActivityFeed(params?: AdminActivityFeedParams): Promise<AdminActivityFeed> {
    return this.getJson<AdminActivityFeed>(`/admin/activity/feed${buildActivityFeedQuery(params)}`);
  }
}

export function createAdminActivityApi(
  client: AuthClient,
  apiBaseUrl: string,
): AdminActivityApi {
  return new AdminActivityApi(client, apiBaseUrl);
}
