import type {
  CommentCreatePayload,
  CommentListResponse,
  FeedComment,
  FeedListParams,
  FeedListResponse,
  FeedPost,
  PostCreatePayload,
  PostMediaUploadResponse,
  ReportPostPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildQuery(params: FeedListParams): string {
  const search = new URLSearchParams();
  const entries: [string, string | number | undefined | null][] = [
    ["cursor", params.cursor],
    ["limit", params.limit],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export class FeedApi extends ApiClientBase {
  listFeed(params: FeedListParams = {}): Promise<FeedListResponse> {
    return this.getJson<FeedListResponse>(`/feed${buildQuery(params)}`);
  }

  getPost(postId: string): Promise<FeedPost> {
    return this.getJson<FeedPost>(`/posts/${encodeURIComponent(postId)}`);
  }

  createPost(payload: PostCreatePayload): Promise<FeedPost> {
    return this.postJson<FeedPost>("/posts", {
      author_type: "citizen",
      body: payload.body,
      media_url: payload.media_url ?? null,
      media_urls: payload.media_urls ?? [],
      visibility: payload.visibility ?? "public",
      post_format: payload.post_format ?? null,
      allow_comments: payload.allow_comments ?? true,
      allow_shares: payload.allow_shares ?? true,
      scheduled_at: payload.scheduled_at ?? null,
      location_label: payload.location_label ?? null,
      activity_label: payload.activity_label ?? null,
      linked_tribe_id: payload.linked_tribe_id ?? null,
      tagged_user_ids: payload.tagged_user_ids ?? [],
      audience_user_ids: payload.audience_user_ids ?? [],
      poll: payload.poll ?? null,
      cross_post_targets: payload.cross_post_targets ?? null,
      use_media_caption: payload.use_media_caption ?? false,
      location: payload.location ?? null,
    });
  }

  uploadPostMedia(file: File): Promise<PostMediaUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return this.postFormData<PostMediaUploadResponse>("/posts/media", form);
  }

  likePost(postId: string): Promise<void> {
    return this.postVoid(`/posts/${encodeURIComponent(postId)}/like`);
  }

  unlikePost(postId: string): Promise<void> {
    return this.deleteVoid(`/posts/${encodeURIComponent(postId)}/like`);
  }

  listComments(postId: string, params: FeedListParams = {}): Promise<CommentListResponse> {
    return this.getJson<CommentListResponse>(
      `/posts/${encodeURIComponent(postId)}/comments${buildQuery(params)}`,
    );
  }

  createComment(postId: string, payload: CommentCreatePayload): Promise<FeedComment> {
    return this.postJson<FeedComment>(`/posts/${encodeURIComponent(postId)}/comments`, payload);
  }

  deleteComment(commentId: string): Promise<void> {
    return this.deleteVoid(`/comments/${encodeURIComponent(commentId)}`);
  }

  reportPost(postId: string, payload: ReportPostPayload): Promise<void> {
    return this.postVoid(`/posts/${encodeURIComponent(postId)}/report`, payload);
  }
}

export function createFeedApi(client: AuthClient, apiBaseUrl: string): FeedApi {
  return new FeedApi(client, apiBaseUrl);
}
