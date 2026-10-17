"use client";

import { ProfileDesktopAbout } from "@/components/profile/desktop/profile-desktop-about";
import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopHeader } from "@/components/profile/desktop/profile-desktop-header";
import { ProfileDesktopPublicOverview } from "@/components/profile/desktop/profile-desktop-public-overview";
import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import { ProfileDesktopPublicSidebar } from "@/components/profile/desktop/profile-desktop-public-sidebar";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import type { FeedPost, LocalEvent, NeighborhoodContributionMeItem, Tribe } from "@yunicity/types";
import type { ProfileDesktopTribeRailItem } from "@yunicity/utils";
import { PROFILE_DESKTOP_TAB_SOON, buildProfilePublicTribeRailItems, type ProfileDesktopTabId } from "@yunicity/utils";
import { useMemo, useState } from "react";

export type ProfileDesktopPublicContext = {
  profile: ProfileDesktopProfile;
  city: string;
  userPosts: FeedPost[];
  tribes: Tribe[];
  contributions: NeighborhoodContributionMeItem[];
  savedEvents: LocalEvent[];
};

/** Profil public desktop — mode visiteur (Suivre / Écrire, maquette Léa Martin). */
export function ProfileDesktopPublicScreen({ ctx }: { ctx: ProfileDesktopPublicContext }) {
  const profile = ctx.profile;
  const [tab, setTab] = useState<ProfileDesktopTabId>("overview");

  const displayName = profile.display_name?.trim() || profile.username;
  const avatarUrl = profile.avatar_url?.trim() || null;
  const tribeItems = useMemo<ProfileDesktopTribeRailItem[]>(
    () => buildProfilePublicTribeRailItems({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  return (
    <div
      className="web-desktop-profile-portal-only mx-auto w-full max-w-[1320px] px-4 py-4 lg:px-6 lg:py-5"
      data-profile-desktop=""
      data-profile-desktop-public=""
    >
      <div className="space-y-5">
        <ProfileDesktopHeader
          profile={profile}
          activeTab={tab}
          onTabChange={setTab}
          mode="visitor"
        />

        {tab === "overview" ? (
          <ProfileDesktopPublicOverview
            profile={profile}
            city={ctx.city}
            posts={ctx.userPosts}
            displayName={displayName}
            avatarUrl={avatarUrl}
            tribeItems={tribeItems}
            contributions={ctx.contributions}
            contributionsLoading={false}
            onOpenContributions={() => setTab("contributions")}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              {tab === "publications" ? (
                <ProfileDesktopPublications
                  posts={ctx.userPosts}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  maxItems={12}
                />
              ) : null}

              {tab === "contributions" ? (
                <ProfileDesktopContributions items={ctx.contributions} loading={false} />
              ) : null}

              {tab === "about" ? (
                <ProfileDesktopAbout profile={profile} city={ctx.city} mode="visitor" />
              ) : null}

              {tab === "activity" ? (
                <p className="text-sm text-neutral-500">{PROFILE_DESKTOP_TAB_SOON}</p>
              ) : null}
            </div>

            <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
              <ProfileDesktopPublicSidebar profile={profile} city={ctx.city} tribeItems={tribeItems} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
