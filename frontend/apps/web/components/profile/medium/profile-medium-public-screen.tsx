"use client";

import { ProfileDesktopAbout } from "@/components/profile/desktop/profile-desktop-about";
import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopHeader } from "@/components/profile/desktop/profile-desktop-header";
import type { ProfileDesktopPublicContext } from "@/components/profile/desktop/profile-desktop-public-screen";
import { ProfileDesktopPublicSidebar } from "@/components/profile/desktop/profile-desktop-public-sidebar";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMediumChromeHeader } from "@/components/profile/medium/profile-medium-chrome-header";
import { ProfileMediumPublicOverview } from "@/components/profile/medium/profile-medium-public-overview";
import type { ProfileDesktopGlanceOuting, ProfileDesktopTribeRailItem } from "@yunicity/utils";
import { PROFILE_DESKTOP_TAB_SOON, buildProfilePublicTribeRailItems, resolveProfileDesktopNextOuting, type ProfileDesktopTabId } from "@yunicity/utils";
import { useMemo, useState } from "react";

/** Profil public medium — 640 → 1023 px, maquette Léa Martin. */
export function ProfileMediumPublicScreen({ ctx }: { ctx: ProfileDesktopPublicContext }) {
  const profile = ctx.profile;
  const [tab, setTab] = useState<ProfileDesktopTabId>("overview");

  const displayName = profile.display_name?.trim() || profile.username;
  const avatarUrl = profile.avatar_url?.trim() || null;
  const tribeItems = useMemo<ProfileDesktopTribeRailItem[]>(
    () => buildProfilePublicTribeRailItems({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  const sharedOuting = useMemo(
    () => resolveProfileDesktopNextOuting(ctx.savedEvents),
    [ctx.savedEvents],
  );

  return (
    <div className="web-medium-profile-portal-only" data-profile-medium="" data-profile-medium-public="">
      <ProfileMediumChromeHeader city={ctx.city} />

      <div className="profile-medium-shell mx-auto w-full max-w-[960px] px-3 pb-5 sm:px-4">
        <div className="space-y-4 sm:space-y-5">
          <ProfileDesktopHeader
            profile={profile}
            activeTab={tab}
            onTabChange={setTab}
            mode="visitor"
            tabLayout="medium"
          />

          {tab === "overview" ? (
            <ProfileMediumPublicOverview
              profile={profile}
              city={ctx.city}
              posts={ctx.userPosts}
              displayName={displayName}
              avatarUrl={avatarUrl}
              tribeItems={tribeItems}
              contributions={ctx.contributions}
              contributionsLoading={false}
              sharedOuting={sharedOuting}
              onOpenPublications={() => setTab("publications")}
              onOpenContributions={() => setTab("contributions")}
            />
          ) : (
            <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1.12fr)_minmax(220px,0.88fr)] sm:gap-5">
              <div className="min-w-0 space-y-4">
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

              <div className="min-w-0 sm:sticky sm:top-[calc(var(--profile-medium-chrome-header-height,4.25rem)+0.5rem)] sm:self-start">
                <ProfileDesktopPublicSidebar
                  profile={profile}
                  city={ctx.city}
                  tribeItems={tribeItems}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
