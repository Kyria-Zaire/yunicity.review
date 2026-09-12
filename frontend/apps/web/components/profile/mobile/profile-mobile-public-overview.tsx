"use client";

import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMobilePublicNavRows } from "@/components/profile/mobile/profile-mobile-public-nav-rows";
import type { FeedPost, NeighborhoodContributionMeItem } from "@yunicity/types";
import type { ProfileDesktopGlanceOuting, ProfileDesktopTabId } from "@yunicity/utils";

type ProfileMobilePublicOverviewProps = {
  posts: FeedPost[];
  displayName: string;
  avatarUrl: string | null;
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  sharedOuting?: ProfileDesktopGlanceOuting | null;
  onOpenPublications?: () => void;
  onOpenContributions?: () => void;
  onOpenTab: (tab: ProfileDesktopTabId) => void;
};

/** Aperçu profil public mobile — publications · contributions · navigation. */
export function ProfileMobilePublicOverview({
  posts,
  displayName,
  avatarUrl,
  contributions,
  contributionsLoading,
  sharedOuting = null,
  onOpenPublications,
  onOpenContributions,
  onOpenTab,
}: ProfileMobilePublicOverviewProps) {
  return (
    <div className="space-y-4" data-profile-mobile-public-overview="">
      <ProfileDesktopPublications
        posts={posts}
        displayName={displayName}
        avatarUrl={avatarUrl}
        maxItems={1}
        sharedOuting={sharedOuting}
        onViewAll={onOpenPublications}
      />

      <ProfileDesktopContributions
        items={contributions}
        loading={contributionsLoading}
        onViewAll={onOpenContributions}
        maxItems={2}
      />

      <ProfileMobilePublicNavRows onOpenTab={onOpenTab} />
    </div>
  );
}
