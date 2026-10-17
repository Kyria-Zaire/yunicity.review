"use client";

import type { FeedPost, LocalEvent, NeighborhoodContributionMeItem, ProfilePublic, Tribe } from "@yunicity/types";
import {
  PROFILE_ME_HREF,
  fetchPublicProfileAnonymous,
  fetchPublicProfileByUserIdAnonymous,
  fetchPublicProfileContributionsAnonymous,
  fetchPublicProfileContributionsByUserIdAnonymous,
  fetchPublicProfilePostsAnonymous,
  fetchPublicProfilePostsByUserIdAnonymous,
  fetchPublicProfileTribesAnonymous,
  fetchPublicProfileTribesByUserIdAnonymous,
  getWebApiBaseUrl,
  isAuthError,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

export type ProfilePublicPortalTarget =
  | { kind: "username"; username: string }
  | { kind: "userId"; userId: string };

async function fetchPublicProfile(
  target: ProfilePublicPortalTarget,
  isAuthenticated: boolean,
  yunicityApi: ReturnType<typeof useAuth>["yunicityApi"],
): Promise<ProfilePublic> {
  const apiBase = getWebApiBaseUrl();

  if (target.kind === "username") {
    if (isAuthenticated) {
      try {
        return await yunicityApi.getPublicProfile(target.username);
      } catch {
        return fetchPublicProfileAnonymous(apiBase, target.username);
      }
    }
    return fetchPublicProfileAnonymous(apiBase, target.username);
  }

  if (isAuthenticated) {
    try {
      return await yunicityApi.getPublicProfileByUserId(target.userId);
    } catch {
      return fetchPublicProfileByUserIdAnonymous(apiBase, target.userId);
    }
  }
  return fetchPublicProfileByUserIdAnonymous(apiBase, target.userId);
}

async function fetchPublicProfilePosts(
  target: ProfilePublicPortalTarget,
  username: string | null,
  isAuthenticated: boolean,
  yunicityApi: ReturnType<typeof useAuth>["yunicityApi"],
): Promise<FeedPost[]> {
  const apiBase = getWebApiBaseUrl();

  try {
    if (target.kind === "username") {
      const response = isAuthenticated
        ? await yunicityApi.getPublicProfilePosts(target.username)
        : await fetchPublicProfilePostsAnonymous(apiBase, target.username);
      return response.items;
    }

    const response = isAuthenticated
      ? await yunicityApi.getPublicProfilePostsByUserId(target.userId)
      : await fetchPublicProfilePostsByUserIdAnonymous(apiBase, target.userId);
    return response.items;
  } catch {
    if (username) {
      try {
        const response = isAuthenticated
          ? await yunicityApi.getPublicProfilePosts(username)
          : await fetchPublicProfilePostsAnonymous(apiBase, username);
        return response.items;
      } catch {
        return [];
      }
    }
    return [];
  }
}

async function fetchPublicProfileContributions(
  target: ProfilePublicPortalTarget,
  username: string | null,
  isAuthenticated: boolean,
  yunicityApi: ReturnType<typeof useAuth>["yunicityApi"],
): Promise<NeighborhoodContributionMeItem[]> {
  const apiBase = getWebApiBaseUrl();

  try {
    if (target.kind === "username") {
      const response = isAuthenticated
        ? await yunicityApi.getPublicProfileContributions(target.username)
        : await fetchPublicProfileContributionsAnonymous(apiBase, target.username);
      return response.items;
    }

    const response = isAuthenticated
      ? await yunicityApi.getPublicProfileContributionsByUserId(target.userId)
      : await fetchPublicProfileContributionsByUserIdAnonymous(apiBase, target.userId);
    return response.items;
  } catch {
    if (username) {
      try {
        const response = isAuthenticated
          ? await yunicityApi.getPublicProfileContributions(username)
          : await fetchPublicProfileContributionsAnonymous(apiBase, username);
        return response.items;
      } catch {
        return [];
      }
    }
    return [];
  }
}

async function fetchPublicProfileTribes(
  target: ProfilePublicPortalTarget,
  username: string | null,
  isAuthenticated: boolean,
  yunicityApi: ReturnType<typeof useAuth>["yunicityApi"],
): Promise<Tribe[]> {
  const apiBase = getWebApiBaseUrl();

  try {
    if (target.kind === "username") {
      const response = isAuthenticated
        ? await yunicityApi.getPublicProfileTribes(target.username)
        : await fetchPublicProfileTribesAnonymous(apiBase, target.username);
      return response.items;
    }

    const response = isAuthenticated
      ? await yunicityApi.getPublicProfileTribesByUserId(target.userId)
      : await fetchPublicProfileTribesByUserIdAnonymous(apiBase, target.userId);
    return response.items;
  } catch {
    if (username) {
      try {
        const response = isAuthenticated
          ? await yunicityApi.getPublicProfileTribes(username)
          : await fetchPublicProfileTribesAnonymous(apiBase, username);
        return response.items;
      } catch {
        return [];
      }
    }
    return [];
  }
}

export function useProfilePublicPortalContext(target: ProfilePublicPortalTarget) {
  const router = useRouter();
  const { isAuthenticated, yunicityApi } = useAuth();
  const username = target.kind === "username" ? target.username : null;
  const userId = target.kind === "userId" ? target.userId : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [profile, setProfile] = useState<ProfilePublic | null>(null);
  const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
  const [contributions, setContributions] = useState<NeighborhoodContributionMeItem[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setIsPrivate(false);
    setIsRedirecting(false);
    setUserPosts([]);
    setContributions([]);
    setTribes([]);

    const resolvedTarget: ProfilePublicPortalTarget =
      username !== null
        ? { kind: "username", username }
        : { kind: "userId", userId: userId! };

    try {
      if (isAuthenticated) {
        try {
          const me = await yunicityApi.getProfileMe();
          const ownByUsername =
            resolvedTarget.kind === "username" &&
            me.username.toLowerCase() === resolvedTarget.username.toLowerCase();
          const ownByUserId =
            resolvedTarget.kind === "userId" && me.user_id === resolvedTarget.userId;

          if (ownByUsername || ownByUserId) {
            setIsRedirecting(true);
            router.replace(PROFILE_ME_HREF);
            return;
          }
        } catch {
          /* session expirée — on tente le profil public anonyme */
        }
      }

      const data = await fetchPublicProfile(resolvedTarget, isAuthenticated, yunicityApi);
      setProfile(data);

      const [posts, contributionItems, tribeItems] = await Promise.all([
        fetchPublicProfilePosts(resolvedTarget, data.username, isAuthenticated, yunicityApi),
        fetchPublicProfileContributions(resolvedTarget, data.username, isAuthenticated, yunicityApi),
        fetchPublicProfileTribes(resolvedTarget, data.username, isAuthenticated, yunicityApi),
      ]);
      setUserPosts(posts);
      setContributions(contributionItems);
      setTribes(tribeItems.filter((tribe) => !tribe.is_archived));
    } catch (err) {
      setProfile(null);
      if (isAuthError(err) && (err.status === 404 || err.code === "PROFILE_NOT_FOUND")) {
        setIsPrivate(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, router, username, userId, yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const city = profile?.city?.trim() || "Reims";

  return {
    loading,
    error,
    isPrivate,
    isRedirecting,
    profile,
    city,
    userPosts,
    contributions,
    tribes,
    savedEvents: [] as LocalEvent[],
    reload: load,
  };
}
