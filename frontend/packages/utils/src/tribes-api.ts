import type {
  Tribe,
  TribeInvitationAcceptPayload,
  TribeInvitationCreateResponse,
  TribeJoinPayload,
  TribeListResponse,
  TribeMember,
  TribeMemberListResponse,
  TribeMemberRoleUpdatePayload,
  TribePostCreatePayload,
  TribePostListResponse,
  TribeUpdatePayload,
} from "@yunicity/types";
import type { FeedPost } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function tribeCityQuery(city: string): string {
  return new URLSearchParams({ city }).toString();
}

export class TribesApi extends ApiClientBase {
  listTribes(params: {
    city: string;
    featured_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<TribeListResponse> {
    const search = new URLSearchParams({ city: params.city });
    if (params.featured_only) {
      search.set("featured_only", "true");
    }
    if (params.page) {
      search.set("page", String(params.page));
    }
    if (params.page_size) {
      search.set("page_size", String(params.page_size));
    }
    return this.getJson<TribeListResponse>(`/tribes?${search.toString()}`);
  }

  getTribe(slug: string, city: string): Promise<Tribe> {
    const qs = tribeCityQuery(city);
    return this.getJson<Tribe>(`/tribes/${encodeURIComponent(slug)}?${qs}`);
  }

  updateTribe(slug: string, city: string, payload: TribeUpdatePayload): Promise<Tribe> {
    const qs = tribeCityQuery(city);
    return this.patchJson<Tribe>(`/tribes/${encodeURIComponent(slug)}?${qs}`, payload);
  }

  joinTribe(slug: string, city: string, payload: TribeJoinPayload): Promise<TribeMember> {
    const qs = tribeCityQuery(city);
    return this.postJson<TribeMember>(
      `/tribes/${encodeURIComponent(slug)}/join?${qs}`,
      payload,
    );
  }

  leaveTribe(slug: string, city: string): Promise<void> {
    const qs = tribeCityQuery(city);
    return this.postVoid(`/tribes/${encodeURIComponent(slug)}/leave?${qs}`);
  }

  listTribePosts(
    slug: string,
    city: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<TribePostListResponse> {
    const search = new URLSearchParams({ city });
    if (params?.cursor) {
      search.set("cursor", params.cursor);
    }
    if (params?.limit) {
      search.set("limit", String(params.limit));
    }
    return this.getJson<TribePostListResponse>(
      `/tribes/${encodeURIComponent(slug)}/posts?${search.toString()}`,
    );
  }

  createTribePost(
    slug: string,
    city: string,
    payload: TribePostCreatePayload,
  ): Promise<FeedPost> {
    const qs = tribeCityQuery(city);
    return this.postJson<FeedPost>(
      `/tribes/${encodeURIComponent(slug)}/posts?${qs}`,
      payload,
    );
  }

  deleteTribePost(slug: string, city: string, postId: string): Promise<void> {
    const qs = tribeCityQuery(city);
    return this.deleteVoid(
      `/tribes/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}?${qs}`,
    );
  }

  listTribeMembers(
    slug: string,
    city: string,
    params?: { page?: number; page_size?: number },
  ): Promise<TribeMemberListResponse> {
    const search = new URLSearchParams({ city });
    if (params?.page) {
      search.set("page", String(params.page));
    }
    if (params?.page_size) {
      search.set("page_size", String(params.page_size));
    }
    return this.getJson<TribeMemberListResponse>(
      `/tribes/${encodeURIComponent(slug)}/members?${search.toString()}`,
    );
  }

  updateTribeMemberRole(
    slug: string,
    city: string,
    userId: string,
    payload: TribeMemberRoleUpdatePayload,
  ): Promise<TribeMember> {
    const qs = tribeCityQuery(city);
    return this.patchJson<TribeMember>(
      `/tribes/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}?${qs}`,
      payload,
    );
  }

  removeTribeMember(slug: string, city: string, userId: string): Promise<void> {
    const qs = tribeCityQuery(city);
    return this.deleteVoid(
      `/tribes/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}?${qs}`,
    );
  }

  createTribeInvitation(slug: string, city: string): Promise<TribeInvitationCreateResponse> {
    const qs = tribeCityQuery(city);
    return this.postJson<TribeInvitationCreateResponse>(
      `/tribes/${encodeURIComponent(slug)}/invite?${qs}`,
      {},
    );
  }

  acceptTribeInvitation(
    token: string,
    payload: TribeInvitationAcceptPayload = { charter_accepted: true },
  ): Promise<TribeMember> {
    return this.postJson<TribeMember>(
      `/tribe-invitations/${encodeURIComponent(token)}/accept`,
      payload,
    );
  }
}

export function createTribesApi(client: AuthClient, apiBaseUrl: string): TribesApi {
  return new TribesApi(client, apiBaseUrl);
}
