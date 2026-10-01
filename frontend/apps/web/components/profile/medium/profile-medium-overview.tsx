"use client";

import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMediumActivity } from "@/components/profile/medium/profile-medium-activity";
import { ProfileMediumGlanceSection } from "@/components/profile/medium/profile-medium-glance-section";
import { ProfileMediumNavRows } from "@/components/profile/medium/profile-medium-nav-rows";
import { ProfileMediumPassportBanner } from "@/components/profile/medium/profile-medium-passport-banner";
import type { FeedPost, NeighborhoodContributionMeItem, ProfileMe } from "@yunicity/types";
import type {
  PassportLevelView,
  ProfileDesktopGlanceOuting,
  ProfileDesktopTribeRailItem,
  ProfileTimelineItem,
} from "@yunicity/utils";
import { PROFILE_MEDIUM_PUBLICATIONS_SEE_ALL } from "@yunicity/utils";

type ProfileMediumOverviewProps = {
  profile: ProfileMe;
  levelView: PassportLevelView | null;
  activeTribe: ProfileDesktopTribeRailItem | null;
  nextOuting: ProfileDesktopGlanceOuting | null;
  city: string;
  posts: FeedPost[];
  displayName: string;
  avatarUrl: string | null;
  timeline: ProfileTimelineItem[];
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  onOpenActivity: () => void;
};

/**
 * Aperçu medium — colonne unique maquette :
 * vie locale → Passport → publications → activité → rangées nav.
 */
export function ProfileMediumOverview({
  profile,
  levelView,
  activeTribe,
  nextOuting,
  city,
  posts,
  displayName,
  avatarUrl,
  timeline,
  contributions,
  contributionsLoading,
  onOpenActivity,
}: ProfileMediumOverviewProps) {
  return (
    <div className="profile-medium-overview space-y-5 sm:space-y-6" data-profile-medium-overview="">
      <ProfileMediumGlanceSection
        levelView={levelView}
        activeTribe={activeTribe}
        nextOuting={nextOuting}
        city={city}
        onSeeAll={onOpenActivity}
      />

      <ProfileMediumPassportBanner levelView={levelView} />

      <ProfileDesktopPublications
        posts={posts}
        displayName={displayName}
        avatarUrl={avatarUrl}
        compact={false}
        maxItems={2}
        seeAllHref="/feed"
        seeAllLabel={PROFILE_MEDIUM_PUBLICATIONS_SEE_ALL}
      />

      <ProfileMediumActivity timeline={timeline} maxItems={4} onViewAll={onOpenActivity} />

      <ProfileMediumNavRows
        profile={profile}
        contributions={contributions}
        contributionsLoading={contributionsLoading}
        city={city}
      />
    </div>
  );
}
