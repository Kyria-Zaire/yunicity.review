"use client";

import { ProfileMobileLevelBanner } from "@/components/profile/mobile/profile-mobile-level-banner";
import { ProfileMobilePostCard } from "@/components/profile/mobile/profile-mobile-post-card";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { FeedPost, ProfileMe } from "@yunicity/types";
import type { PassportLevelView, ProfileMobileContentTabId } from "@yunicity/utils";
import {
  applyFeedLikeToggle,
  buildSettingsDisplayName,
  PROFILE_MOBILE_POSTS_EMPTY,
  PROFILE_MOBILE_TAB_SOON,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

type ProfileMobilePostsFeedProps = {
  profile: ProfileMe;
  posts: FeedPost[];
  levelView: PassportLevelView | null;
  activeTab: ProfileMobileContentTabId;
};

/** Fil publications profil mobile (MOBILE-PROFILE-01). */
export function ProfileMobilePostsFeed({
  profile,
  posts,
  levelView,
  activeTab,
}: ProfileMobilePostsFeedProps) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [items, setItems] = useState(posts);
  const displayName = buildSettingsDisplayName(profile, user);

  useEffect(() => {
    setItems(posts);
  }, [posts]);

  const toggleLike = useCallback(
    async (post: FeedPost) => {
      const nextLiked = !post.liked_by_me;
      setItems((current) =>
        current.map((item) =>
          item.id === post.id ? applyFeedLikeToggle(item, nextLiked) : item,
        ),
      );
      try {
        if (nextLiked) {
          await api.likeFeedPost(post.id);
        } else {
          await api.unlikeFeedPost(post.id);
        }
      } catch {
        setItems((current) =>
          current.map((item) =>
            item.id === post.id ? applyFeedLikeToggle(item, post.liked_by_me) : item,
          ),
        );
      }
    },
    [api],
  );

  if (activeTab !== "publications") {
    return (
      <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-10 text-center text-sm text-neutral-500">
        {PROFILE_MOBILE_TAB_SOON}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-10 text-center text-sm text-neutral-500">
        {PROFILE_MOBILE_POSTS_EMPTY}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((post, index) => (
        <div key={post.id} className="space-y-3">
          <ProfileMobilePostCard
            post={post}
            displayName={displayName}
            onToggleLike={() => void toggleLike(post)}
          />
          {index === 0 && levelView ? <ProfileMobileLevelBanner levelView={levelView} /> : null}
        </div>
      ))}
    </div>
  );
}
