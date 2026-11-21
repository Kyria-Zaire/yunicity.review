"use client";

import { ProfileDesktopActivity } from "@/components/profile/desktop/profile-desktop-activity";
import { ProfileDesktopGlance } from "@/components/profile/desktop/profile-desktop-glance";
import { ProfileDesktopInterests } from "@/components/profile/desktop/profile-desktop-interests";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileDesktopRail } from "@/components/profile/desktop/profile-desktop-rail";
import type { FeedPost, NeighborhoodContributionMeItem, ProfileMe } from "@yunicity/types";
import type {
  PassportLevelView,
  ProfileDesktopGlanceOuting,
  ProfileDesktopTribeRailItem,
  ProfileTimelineItem,
} from "@yunicity/utils";
import { PROFILE_DESKTOP_GLANCE_TITLE } from "@yunicity/utils";

type ProfileDesktopOverviewProps = {
  profile: ProfileMe;
  levelView: PassportLevelView | null;
  activeTribe: ProfileDesktopTribeRailItem | null;
  nextOuting: ProfileDesktopGlanceOuting | null;
  city: string;
  posts: FeedPost[];
  displayName: string;
  avatarUrl: string | null;
  timeline: ProfileTimelineItem[];
  tribeItems: ProfileDesktopTribeRailItem[];
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  onOpenActivity: () => void;
};

/**
 * Aperçu Mon profil desktop (owner) — maquette 1 :
 * [ glance | activité + intérêts ] | rail + publications
 */
export function ProfileDesktopOverview({
  profile,
  levelView,
  activeTribe,
  nextOuting,
  city,
  posts,
  displayName,
  avatarUrl,
  timeline,
  tribeItems,
  contributions,
  contributionsLoading,
  onOpenActivity,
}: ProfileDesktopOverviewProps) {
  return (
    <div
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]"
      data-profile-desktop-overview=""
    >
      <div className="min-w-0 space-y-5">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.9fr)]">
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_GLANCE_TITLE}</h2>
            <div className="mt-4">
              <ProfileDesktopGlance
                levelView={levelView}
                activeTribe={activeTribe}
                nextOuting={nextOuting}
                city={city}
              />
            </div>
          </section>

          <div className="space-y-4">
            <ProfileDesktopActivity
              timeline={timeline}
              maxItems={5}
              onViewAll={onOpenActivity}
            />
            <ProfileDesktopInterests profile={profile} />
          </div>
        </div>

        <ProfileDesktopPublications
          posts={posts}
          displayName={displayName}
          avatarUrl={avatarUrl}
          compact
          maxItems={3}
        />
      </div>

      <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <ProfileDesktopRail
          profile={profile}
          levelView={levelView}
          tribeItems={tribeItems}
          contributions={contributions}
          contributionsLoading={contributionsLoading}
          city={city}
        />
      </aside>
    </div>
  );
}
