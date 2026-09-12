import type {
  FeedListResponse,
  NeighborhoodContributionMeListResponse,
  ProfileCompleteRequest,
  ProfileMe,
  ProfilePublic,
  ProfileUpdateRequest,
  TribeListResponse,
  UserProfile,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { AuthError, parseApiError } from "./auth/auth-errors";
import { ApiClientBase } from "./api-client";

export class ProfileApi extends ApiClientBase {
  getProfileMe(): Promise<UserProfile> {
    return this.getJson<UserProfile>("/profile/me");
  }

  updateProfileMe(payload: ProfileUpdateRequest): Promise<UserProfile> {
    return this.patchJson<UserProfile>("/profile/me", payload);
  }

  completeProfileOnboarding(payload: ProfileCompleteRequest): Promise<UserProfile> {
    return this.postJson<UserProfile>("/profile/complete", payload);
  }

  getPublicProfile(username: string): Promise<ProfilePublic> {
    return this.getJson<ProfilePublic>(`/profile/${encodeURIComponent(username)}`);
  }

  getPublicProfileByUserId(userId: string): Promise<ProfilePublic> {
    return this.getJson<ProfilePublic>(`/users/${encodeURIComponent(userId)}/profile`);
  }

  getPublicProfilePosts(username: string, limit = 12): Promise<FeedListResponse> {
    return this.getJson<FeedListResponse>(
      `/profile/${encodeURIComponent(username)}/posts?limit=${limit}`,
    );
  }

  getPublicProfilePostsByUserId(userId: string, limit = 12): Promise<FeedListResponse> {
    return this.getJson<FeedListResponse>(
      `/users/${encodeURIComponent(userId)}/posts?limit=${limit}`,
    );
  }

  getPublicProfileContributions(username: string, limit = 12): Promise<NeighborhoodContributionMeListResponse> {
    return this.getJson<NeighborhoodContributionMeListResponse>(
      `/profile/${encodeURIComponent(username)}/contributions?limit=${limit}`,
    );
  }

  getPublicProfileContributionsByUserId(
    userId: string,
    limit = 12,
  ): Promise<NeighborhoodContributionMeListResponse> {
    return this.getJson<NeighborhoodContributionMeListResponse>(
      `/users/${encodeURIComponent(userId)}/contributions?limit=${limit}`,
    );
  }

  getPublicProfileTribes(username: string, limit = 12): Promise<TribeListResponse> {
    return this.getJson<TribeListResponse>(
      `/profile/${encodeURIComponent(username)}/tribes?limit=${limit}`,
    );
  }

  getPublicProfileTribesByUserId(userId: string, limit = 12): Promise<TribeListResponse> {
    return this.getJson<TribeListResponse>(
      `/users/${encodeURIComponent(userId)}/tribes?limit=${limit}`,
    );
  }

  uploadProfileAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("file", file);
    return this.postFormData<UserProfile>("/profile/me/avatar", formData);
  }

  uploadProfileBanner(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("file", file);
    return this.postFormData<UserProfile>("/profile/me/banner", formData);
  }
}

export function createProfileApi(client: AuthClient, apiBaseUrl: string): ProfileApi {
  return new ProfileApi(client, apiBaseUrl);
}

/** Profil public sans session (pas de token requis pour les profils publics). */
export async function fetchPublicProfileAnonymous(
  apiBaseUrl: string,
  username: string,
): Promise<ProfilePublic> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/profile/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ProfilePublic;
}

/** Profil public par identifiant utilisateur (sans session). */
export async function fetchPublicProfileByUserIdAnonymous(
  apiBaseUrl: string,
  userId: string,
): Promise<ProfilePublic> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/users/${encodeURIComponent(userId)}/profile`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ProfilePublic;
}

/** Publications publiques d'un profil (sans session). */
export async function fetchPublicProfilePostsAnonymous(
  apiBaseUrl: string,
  username: string,
  limit = 12,
): Promise<FeedListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/profile/${encodeURIComponent(username)}/posts?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as FeedListResponse;
}

/** Publications publiques par identifiant utilisateur (sans session). */
export async function fetchPublicProfilePostsByUserIdAnonymous(
  apiBaseUrl: string,
  userId: string,
  limit = 12,
): Promise<FeedListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/users/${encodeURIComponent(userId)}/posts?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as FeedListResponse;
}

/** Contributions publiques d'un profil (sans session). */
export async function fetchPublicProfileContributionsAnonymous(
  apiBaseUrl: string,
  username: string,
  limit = 12,
): Promise<NeighborhoodContributionMeListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/profile/${encodeURIComponent(username)}/contributions?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as NeighborhoodContributionMeListResponse;
}

/** Contributions publiques par identifiant utilisateur (sans session). */
export async function fetchPublicProfileContributionsByUserIdAnonymous(
  apiBaseUrl: string,
  userId: string,
  limit = 12,
): Promise<NeighborhoodContributionMeListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/users/${encodeURIComponent(userId)}/contributions?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as NeighborhoodContributionMeListResponse;
}

/** Tribus publiques d'un profil (sans session). */
export async function fetchPublicProfileTribesAnonymous(
  apiBaseUrl: string,
  username: string,
  limit = 12,
): Promise<TribeListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/profile/${encodeURIComponent(username)}/tribes?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as TribeListResponse;
}

/** Tribus publiques par identifiant utilisateur (sans session). */
export async function fetchPublicProfileTribesByUserIdAnonymous(
  apiBaseUrl: string,
  userId: string,
  limit = 12,
): Promise<TribeListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/users/${encodeURIComponent(userId)}/tribes?limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  if (response.status === 404) {
    throw new AuthError("PROFILE_NOT_FOUND", "Ce profil n'est pas accessible.", 404);
  }
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as TribeListResponse;
}
