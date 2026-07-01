import type {
  LocalVideo,
  LocalVideoComment,
  LocalVideoCommentCreatePayload,
  LocalVideoCommentListResponse,
  LocalVideoFeedItem,
  LocalVideoLikeResponse,
  LocalVideoListParams,
  LocalVideoListResponse,
  LocalVideoPublishAcceptedResponse,
  LocalVideoPublishPayload,
  LocalVideoReportCreatePayload,
  LocalVideoUpload,
  LocalVideoUploadInitPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";
import { parseLocalVideoApiError } from "./local-video-errors";
import { uploadLocalVideoBinaryDev, uploadLocalVideoBytes } from "./local-video-upload";

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
  /** @alias createUpload */
  initUpload(payload: LocalVideoUploadInitPayload): Promise<LocalVideoUpload> {
    return this.postJson<LocalVideoUpload>("/local-videos/upload-init", payload);
  }

  createUpload(payload: LocalVideoUploadInitPayload): Promise<LocalVideoUpload> {
    return this.initUpload(payload);
  }

  publishVideo(payload: LocalVideoPublishPayload): Promise<LocalVideoPublishAcceptedResponse> {
    return this.postJson<LocalVideoPublishAcceptedResponse>("/local-videos", payload);
  }

  /**
   * Envoie les octets de la session upload — R2 presigné ou endpoint dev authentifié.
   * Compose `uploadLocalVideoBytes` / `uploadLocalVideoBinaryDev` (VIDEO-04A).
   */
  uploadSessionBytes(
    upload: LocalVideoUpload,
    body: Blob | ArrayBuffer | Uint8Array,
  ): Promise<void> {
    if (this.isDevFilesystemUploadUrl(upload.presigned_url)) {
      return uploadLocalVideoBinaryDev(
        this.client,
        this.apiBaseUrl,
        upload.upload_id,
        body,
      );
    }
    return uploadLocalVideoBytes({ upload, body });
  }

  /** Feed deep-link compat (existing web callers expect `LocalVideoFeedItem`). */
  getLocalVideo(videoId: string): Promise<LocalVideoFeedItem> {
    return this.getJson<LocalVideoFeedItem>(`/local-videos/${encodeURIComponent(videoId)}`);
  }

  /** Detail shape for upload / processing polling (VIDEO-04A). */
  getVideo(videoId: string): Promise<LocalVideo> {
    return this.getJson<LocalVideo>(`/local-videos/${encodeURIComponent(videoId)}`);
  }

  /** @alias listLocalVideos */
  listVideos(params: LocalVideoListParams = {}): Promise<LocalVideoListResponse> {
    return this.listLocalVideos(params);
  }

  listLocalVideos(params: LocalVideoListParams = {}): Promise<LocalVideoListResponse> {
    return this.getJson<LocalVideoListResponse>(`/local-videos/feed${buildLocalVideoQuery(params)}`);
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

  protected override async readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await parseLocalVideoApiError(response);
    }
    return (await response.json()) as T;
  }

  protected override async postVoid(segment: string, body?: unknown): Promise<void> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw await parseLocalVideoApiError(response);
    }
  }

  protected override async deleteVoid(segment: string): Promise<void> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "DELETE" });
    if (!response.ok) {
      throw await parseLocalVideoApiError(response);
    }
  }

  private async deleteJson<T>(segment: string): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "DELETE" });
    return this.readJson<T>(response);
  }

  private isDevFilesystemUploadUrl(url: string): boolean {
    return url.includes("/local-videos/uploads/") && url.includes("/binary");
  }
}

export function createLocalVideosApi(client: AuthClient, apiBaseUrl: string): LocalVideosApi {
  return new LocalVideosApi(client, apiBaseUrl);
}

/**
 * Adaptateur minimal pour réutiliser une vidéo détail dans le feed (deep link).
 * Les champs sociaux / auteur sont neutres — le feed complet reste la source de vérité.
 */
export function mapLocalVideoToFeedPreview(video: LocalVideo): LocalVideoFeedItem {
  return {
    id: video.id,
    author_user_id: video.author_user_id,
    author: {
      id: video.author_user_id,
      username: null,
      full_name: video.title?.trim() || "Créateur local",
      avatar_url: null,
    },
    city: video.city,
    neighborhood_id: video.neighborhood_id,
    neighborhood_name: "",
    neighborhood_slug: "",
    video_type: video.video_type,
    title: video.title,
    description: video.description,
    cultural_place_id: video.cultural_place_id,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: video.local_event_id,
    tribe_id: video.tribe_id,
    organization_id: video.organization_id,
    media_url: video.media_url,
    thumbnail_url: video.thumbnail_url,
    duration_seconds: video.duration_seconds,
    mime_type: video.mime_type,
    latitude: video.latitude,
    longitude: video.longitude,
    status: video.status === "processing" || video.status === "failed" ? video.status : "published",
    published_at: video.published_at,
    created_at: video.created_at,
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  };
}
