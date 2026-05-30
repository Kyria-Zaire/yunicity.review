import type {
  DiscussionCreatePayload,
  DiscussionInsightsResponse,
  DiscussionListParams,
  DiscussionListResponse,
  DiscussionThread,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildQuery(params: DiscussionListParams): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.require_comments) search.set("require_comments", "true");
  const query = search.toString();
  return query ? `?${query}` : "";
}

export class DiscussionsApi extends ApiClientBase {
  listDiscussions(params: DiscussionListParams = {}): Promise<DiscussionListResponse> {
    return this.getJson<DiscussionListResponse>(`/discussions${buildQuery(params)}`);
  }

  createDiscussion(payload: DiscussionCreatePayload): Promise<DiscussionThread> {
    return this.postJson<DiscussionThread>("/discussions", payload);
  }

  getInsights(): Promise<DiscussionInsightsResponse> {
    return this.getJson<DiscussionInsightsResponse>("/discussions/insights");
  }
}

export function createDiscussionsApi(client: AuthClient, apiBaseUrl: string): DiscussionsApi {
  return new DiscussionsApi(client, apiBaseUrl);
}
