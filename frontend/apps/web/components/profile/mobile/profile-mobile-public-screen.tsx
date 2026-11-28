"use client";

import { ProfileDesktopAbout } from "@/components/profile/desktop/profile-desktop-about";
import { ProfileDesktopContributions } from "@/components/profile/desktop/profile-desktop-contributions";
import { ProfileDesktopHeader } from "@/components/profile/desktop/profile-desktop-header";
import type { ProfileDesktopPublicContext } from "@/components/profile/desktop/profile-desktop-public-screen";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMobilePublicOverview } from "@/components/profile/mobile/profile-mobile-public-overview";
import {
  PROFILE_DESKTOP_TAB_SOON,
  buildProfilePublicTribeRailItems,
  resolveProfileDesktopNextOuting,
  type ProfileDesktopTabId,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

/** Profil public mobile — viewport &lt;640 px, maquette Léa Martin. */
export function ProfileMobilePublicScreen({ ctx }: { ctx: ProfileDesktopPublicContext }) {
  const profile = ctx.profile;
  const [tab, setTab] = useState<ProfileDesktopTabId>("overview");

  const displayName = profile.display_name?.trim() || profile.username;
  const avatarUrl = profile.avatar_url?.trim() || null;
  const tribeItems = useMemo(
    () => buildProfilePublicTribeRailItems({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  const sharedOuting = useMemo(
    () => resolveProfileDesktopNextOuting(ctx.savedEvents),
    [ctx.savedEvents],
  );

  return (
    <div
      className="web-mobile-profile-portal-only min-w-0 bg-[#F4F5F7]"
      data-profile-mobile=""
      data-profile-mobile-public=""
    >
      <div className="mx-auto w-full max-w-lg px-3 pb-6 pt-0">
        <div className="space-y-4">
          <ProfileDesktopHeader
            profile={profile}
            activeTab={tab}
            onTabChange={setTab}
            mode="visitor"
            tabLayout="medium"
            headerLayout="mobile"
          />

          {tab === "overview" ? (
            <ProfileMobilePublicOverview
              posts={ctx.userPosts}
              displayName={displayName}
              avatarUrl={avatarUrl}
              contributions={ctx.contributions}
              contributionsLoading={false}
              sharedOuting={sharedOuting}
              onOpenPublications={() => setTab("publications")}
              onOpenContributions={() => setTab("contributions")}
              onOpenTab={setTab}
            />
          ) : (
            <div className="space-y-4">
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
                <>
                  <ProfileDesktopAbout profile={profile} city={ctx.city} mode="visitor" />
                  {tribeItems.length > 0 ? (
                    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                      <h2 className="text-sm font-bold text-neutral-900">Tribus publiques</h2>
                      <ul className="mt-3 space-y-2">
                        {tribeItems.map((tribe) => (
                          <li key={tribe.id}>
                            <a
                              href={tribe.href}
                              className="text-sm font-semibold text-yunicity-primary hover:underline"
                            >
                              {tribe.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              ) : null}

              {tab === "activity" ? (
                <p className="text-sm text-neutral-500">{PROFILE_DESKTOP_TAB_SOON}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
