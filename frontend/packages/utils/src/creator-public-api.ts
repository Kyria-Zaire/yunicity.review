import type {
  CreatorPublicDetailResponse,
  CreatorPublicDirectoryListParams,
  CreatorPublicDirectoryListResponse,
  CreatorPublicListParams,
  CreatorPublicListResponse,
  CreatorPublicProfile,
  CreatorPublicProfileParams,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export const CREATOR_HUB_LIST_LIMIT_DEFAULT = 24;
export const CREATOR_PROFILE_CONTENTS_LIMIT_DEFAULT = 24;
export const CREATOR_DIRECTORY_LIST_LIMIT_DEFAULT = 24;

function buildCreatorPublicQuery(params: CreatorPublicListParams): string {
  const search = new URLSearchParams();
  search.set("city", params.city?.trim() || "Reims");
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }
  return `?${search.toString()}`;
}

export class CreatorPublicApi extends ApiClientBase {
  listCreatorContent(params: CreatorPublicListParams = {}): Promise<CreatorPublicListResponse> {
    const query = buildCreatorPublicQuery({
      ...params,
      limit: params.limit ?? CREATOR_HUB_LIST_LIMIT_DEFAULT,
      offset: params.offset ?? 0,
    });
    return this.getJson<CreatorPublicListResponse>(`/creator-content${query}`);
  }

  getCreatorContentDetail(contentId: string): Promise<CreatorPublicDetailResponse> {
    const id = contentId.trim();
    return this.getJson<CreatorPublicDetailResponse>(`/creator-content/${encodeURIComponent(id)}`);
  }

  listCreators(
    params: CreatorPublicDirectoryListParams = {},
  ): Promise<CreatorPublicDirectoryListResponse> {
    const search = new URLSearchParams();
    search.set("city", params.city?.trim() || "Reims");
    if (params.q?.trim()) {
      search.set("q", params.q.trim());
    }
    if (params.limit !== undefined) {
      search.set("limit", String(params.limit));
    }
    if (params.offset !== undefined) {
      search.set("offset", String(params.offset));
    }
    return this.getJson<CreatorPublicDirectoryListResponse>(
      `/public/creators?${search.toString()}`,
    );
  }

  getCreatorProfile(
    creatorId: string,
    params: CreatorPublicProfileParams = {},
  ): Promise<CreatorPublicProfile> {
    const id = creatorId.trim();
    const search = new URLSearchParams();
    if (params.limit !== undefined) {
      search.set("limit", String(params.limit));
    }
    if (params.offset !== undefined) {
      search.set("offset", String(params.offset));
    }
    const query = search.toString();
    const suffix = query ? `?${query}` : "";
    return this.getJson<CreatorPublicProfile>(
      `/public/creators/${encodeURIComponent(id)}${suffix}`,
    );
  }
}

export function createCreatorPublicApi(client: AuthClient, apiBaseUrl: string): CreatorPublicApi {
  return new CreatorPublicApi(client, apiBaseUrl);
}
