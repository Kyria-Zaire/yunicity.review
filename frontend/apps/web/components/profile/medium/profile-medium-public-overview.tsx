"use client";

import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopPublicSidebar } from "@/components/profile/desktop/profile-desktop-public-sidebar";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import type { FeedPost, NeighborhoodContributionMeItem } from "@yunicity/types";
import type { ProfileDesktopGlanceOuting, ProfileDesktopTribeRailItem } from "@yunicity/utils";

type ProfileMediumPublicOverviewProps = {
  profile: ProfileDesktopProfile;
  city: string;
  posts: FeedPost[];
  displayName: string;
  avatarUrl: string | null;
  tribeItems: ProfileDesktopTribeRailItem[];
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  sharedOuting?: ProfileDesktopGlanceOuting | null;
  onOpenPublications?: () => void;
  onOpenContributions?: () => void;
};

/**
 * Aperçu profil public medium — maquette Léa Martin :
 * colonne gauche (publications + contributions) · sidebar droite.
 */
export function ProfileMediumPublicOverview({
  profile,
  city,
  posts,
  displayName,
  avatarUrl,
  tribeItems,
  contributions,
  contributionsLoading,
  sharedOuting = null,
  onOpenPublications,
  onOpenContributions,
}: ProfileMediumPublicOverviewProps) {
  return (
    <div
      className="grid items-start gap-4 sm:grid-cols-[minmax(0,1.12fr)_minmax(220px,0.88fr)] sm:gap-5"
      data-profile-medium-public-overview=""
    >
      <div className="min-w-0 space-y-4 sm:space-y-5">
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
      </div>

      <div className="min-w-0 sm:sticky sm:top-[calc(var(--profile-medium-chrome-header-height,4.25rem)+0.5rem)] sm:self-start">
        <ProfileDesktopPublicSidebar profile={profile} city={city} tribeItems={tribeItems} />
      </div>
    </div>
  );
}
