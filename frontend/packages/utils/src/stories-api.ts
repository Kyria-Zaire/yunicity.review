import type {
  StoryCreatePayload,
  StoryInsightsResponse,
  StoryItem,
  StoryListParams,
  StoryListResponse,
  StoryMediaUploadResponse,
  StoryRingsResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildQuery(params: StoryListParams): string {
  const search = new URLSearchParams();
  if (params.tab) search.set("tab", params.tab);
  if (params.category) search.set("category", params.category);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit != null) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export class StoriesApi extends ApiClientBase {
  listStories(params: StoryListParams = {}): Promise<StoryListResponse> {
    return this.getJson<StoryListResponse>(`/stories${buildQuery(params)}`);
  }

  listRings(): Promise<StoryRingsResponse> {
    return this.getJson<StoryRingsResponse>("/stories/rings");
  }

  getInsights(): Promise<StoryInsightsResponse> {
    return this.getJson<StoryInsightsResponse>("/stories/insights");
  }

  createStory(payload: StoryCreatePayload): Promise<StoryItem> {
    return this.postJson<StoryItem>("/stories", payload);
  }

  uploadMedia(file: File): Promise<StoryMediaUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.postFormData<StoryMediaUploadResponse>("/stories/media", formData);
  }

  recordView(storyId: string): Promise<void> {
    return this.postVoid(`/stories/${encodeURIComponent(storyId)}/view`);
  }
}

export function createStoriesApi(client: AuthClient, apiBaseUrl: string): StoriesApi {
  return new StoriesApi(client, apiBaseUrl);
}
