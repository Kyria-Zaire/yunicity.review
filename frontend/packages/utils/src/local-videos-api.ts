import type {
  LocalVideoComment,
  LocalVideoCommentCreatePayload,
  LocalVideoCommentListResponse,
  LocalVideoFeedItem,
  LocalVideoLikeResponse,
  LocalVideoListParams,
  LocalVideoListResponse,
  LocalVideoReportCreatePayload,
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

function buildCommentQuery(cursor?: string | null, limit?: number): string {
  const search = new URLSearchParams();
  if (cursor) search.set("cursor", cursor);
  if (limit != null) search.set("limit", String(limit));
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

  likeLocalVideo(videoId: string): Promise<LocalVideoLikeResponse> {
    return this.postJson<LocalVideoLikeResponse>(
      `/local-videos/${encodeURIComponent(videoId)}/like`,
      {},
    );
  }

  unlikeLocalVideo(videoId: string): Promise<LocalVideoLikeResponse> {
    return this.deleteJson<LocalVideoLikeResponse>(
      `/local-videos/${encodeURIComponent(videoId)}/like`,
    );
  }

  listLocalVideoComments(
    videoId: string,
    params: { cursor?: string | null; limit?: number } = {},
  ): Promise<LocalVideoCommentListResponse> {
    return this.getJson<LocalVideoCommentListResponse>(
      `/local-videos/${encodeURIComponent(videoId)}/comments${buildCommentQuery(params.cursor, params.limit)}`,
    );
  }

  createLocalVideoComment(
    videoId: string,
    payload: LocalVideoCommentCreatePayload,
  ): Promise<LocalVideoComment> {
    return this.postJson<LocalVideoComment>(
      `/local-videos/${encodeURIComponent(videoId)}/comments`,
      payload,
    );
  }

  deleteLocalVideoComment(commentId: string): Promise<void> {
    return this.deleteVoid(`/local-videos/comments/${encodeURIComponent(commentId)}`);
  }

  reportLocalVideo(videoId: string, payload: LocalVideoReportCreatePayload): Promise<void> {
    return this.postVoid(`/local-videos/${encodeURIComponent(videoId)}/report`, payload);
  }

  private async deleteJson<T>(segment: string): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "DELETE" });
    return this.readJson<T>(response);
  }
}

export function createLocalVideosApi(client: AuthClient, apiBaseUrl: string): LocalVideosApi {
  return new LocalVideosApi(client, apiBaseUrl);
}
