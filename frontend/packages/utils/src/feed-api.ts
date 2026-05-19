import type {
  CommentCreatePayload,
  CommentListResponse,
  FeedComment,
  FeedListParams,
  FeedListResponse,
  FeedPost,
  PostCreatePayload,
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
    });
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
