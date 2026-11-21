"use client";

import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopPublicSidebar } from "@/components/profile/desktop/profile-desktop-public-sidebar";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import type { FeedPost, NeighborhoodContributionMeItem } from "@yunicity/types";
import type { ProfileDesktopGlanceOuting, ProfileDesktopTribeRailItem } from "@yunicity/utils";

type ProfileDesktopPublicOverviewProps = {
  profile: ProfileDesktopProfile;
  city: string;
  posts: FeedPost[];
  displayName: string;
  avatarUrl: string | null;
  tribeItems: ProfileDesktopTribeRailItem[];
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  sharedOuting?: ProfileDesktopGlanceOuting | null;
  onOpenContributions?: () => void;
};

/**
 * Aperçu profil public desktop — maquette Léa Martin :
 * Publications récentes | Contributions publiques | Sidebar
 */
export function ProfileDesktopPublicOverview({
  profile,
  city,
  posts,
  displayName,
  avatarUrl,
  tribeItems,
  contributions,
  contributionsLoading,
  sharedOuting = null,
  onOpenContributions,
}: ProfileDesktopPublicOverviewProps) {
  return (
    <div
      className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.82fr)_minmax(240px,0.72fr)]"
      data-profile-desktop-public-overview=""
    >
      <ProfileDesktopPublications
        posts={posts}
        displayName={displayName}
        avatarUrl={avatarUrl}
        maxItems={2}
        sharedOuting={sharedOuting}
      />

      <ProfileDesktopContributions
        items={contributions}
        loading={contributionsLoading}
        onViewAll={onOpenContributions}
      />

      <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <ProfileDesktopPublicSidebar profile={profile} city={city} tribeItems={tribeItems} />
      </div>
    </div>
  );
}
