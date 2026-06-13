import type {
  LocalVideoFeedItem,
  LocalVideoListParams,
  LocalVideoListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildLocalVideoQuery(params: LocalVideoListParams): string {
  const search = new URLSearchParams();
  if (params.city) search.set("city", params.city);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.latitude != null) search.set("latitude", String(params.latitude));
  if (params.longitude != null) search.set("longitude", String(params.longitude));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export class LocalVideosApi extends ApiClientBase {
  listLocalVideos(params: LocalVideoListParams = {}): Promise<LocalVideoListResponse> {
    return this.getJson<LocalVideoListResponse>(`/local-videos/feed${buildLocalVideoQuery(params)}`);
  }

  getLocalVideo(videoId: string): Promise<LocalVideoFeedItem> {
    return this.getJson<LocalVideoFeedItem>(`/local-videos/${encodeURIComponent(videoId)}`);
  }
}

export function createLocalVideosApi(client: AuthClient, apiBaseUrl: string): LocalVideosApi {
  return new LocalVideosApi(client, apiBaseUrl);
}
