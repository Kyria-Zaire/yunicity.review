"use client";

import { ProfileDesktopAbout } from "@/components/profile/desktop/profile-desktop-about";
import { ProfileDesktopActivity } from "@/components/profile/desktop/profile-desktop-activity";
import { ProfileDesktopHeader } from "@/components/profile/desktop/profile-desktop-header";
import { ProfileDesktopOverview } from "@/components/profile/desktop/profile-desktop-overview";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileDesktopRail } from "@/components/profile/desktop/profile-desktop-rail";
import { ProfileMemoryCard } from "@/components/profile/profile-memory-card";
import { useProfileMemories } from "@/hooks/use-profile-memories";
import type { useProfilePortalContext } from "@/hooks/use-profile-portal-context";
import {
  PROFILE_DESKTOP_TAB_SOON,
  PROFILE_MEMORIES_EMPTY_BODY,
  PROFILE_MEMORIES_EMPTY_CTA,
  PROFILE_MEMORIES_EMPTY_HREF,
  PROFILE_MEMORIES_EMPTY_TITLE,
  PROFILE_MEMORIES_LOADING,
  PROFILE_PORTAL_ONBOARDING_BODY,
  PROFILE_PORTAL_ONBOARDING_CTA,
  PROFILE_PORTAL_ONBOARDING_TITLE,
  buildProfileDesktopTribeRailItems,
  resolveProfileDesktopActiveTribe,
  resolveProfileDesktopNextOuting,
  type ProfileDesktopTabId,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

type ProfilePortalCtx = ReturnType<typeof useProfilePortalContext>;

/** Mon profil desktop — mode owner (Modifier, vie locale, rail passport). */
export function ProfileDesktopOwnerScreen({ ctx }: { ctx: ProfilePortalCtx }) {
  const profile = ctx.profile!;
  const [tab, setTab] = useState<ProfileDesktopTabId>("overview");
  const memories = useProfileMemories();

  const displayName = profile.display_name?.trim() || profile.username;
  const avatarUrl = profile.avatar_url?.trim() || null;

  const tribeRailItems = useMemo(
    () => buildProfileDesktopTribeRailItems({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  const activeTribe = useMemo(
    () => resolveProfileDesktopActiveTribe({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  const nextOuting = useMemo(
    () => resolveProfileDesktopNextOuting(ctx.savedEvents),
    [ctx.savedEvents],
  );

  return (
    <div
      className="web-desktop-profile-portal-only mx-auto w-full max-w-[1320px] px-4 py-4 lg:px-6 lg:py-5"
      data-profile-desktop=""
      data-profile-desktop-owner=""
    >
      <div className="space-y-5">
        <ProfileDesktopHeader
          profile={profile}
          activeTab={tab}
          onTabChange={setTab}
          mode="owner"
        />

        {!profile.onboarding_completed ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">{PROFILE_PORTAL_ONBOARDING_TITLE}</p>
            <p className="mt-1 text-sm text-amber-800">{PROFILE_PORTAL_ONBOARDING_BODY}</p>
            <Link
              href="/profile/me/edit"
              className="mt-3 inline-flex rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white"
            >
              {PROFILE_PORTAL_ONBOARDING_CTA}
            </Link>
          </section>
        ) : null}

        {tab === "overview" ? (
          <ProfileDesktopOverview
            profile={profile}
            levelView={ctx.levelView}
            activeTribe={activeTribe}
            nextOuting={nextOuting}
            city={ctx.city}
            posts={ctx.userPosts}
            displayName={displayName}
            avatarUrl={avatarUrl}
            timeline={ctx.activityTimeline}
            tribeItems={tribeRailItems}
            contributions={memories.items}
            contributionsLoading={memories.loading}
            onOpenActivity={() => setTab("activity")}
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
                  sharedOuting={nextOuting}
                />
              ) : null}

              {tab === "contributions" ? (
                <>
                  {memories.loading ? (
                    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                      <p className="text-sm text-neutral-500" role="status">
                        {PROFILE_MEMORIES_LOADING}
                      </p>
                    </section>
                  ) : memories.items.length === 0 ? (
                    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                      <p className="font-semibold text-neutral-800">{PROFILE_MEMORIES_EMPTY_TITLE}</p>
                      <p className="mt-1 text-sm text-neutral-500">{PROFILE_MEMORIES_EMPTY_BODY}</p>
                      <Link
                        href={PROFILE_MEMORIES_EMPTY_HREF}
                        className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
                      >
                        {PROFILE_MEMORIES_EMPTY_CTA}
                      </Link>
                    </section>
                  ) : (
                    <ul className="space-y-3">
                      {memories.items.map((item) => (
                        <li key={item.id}>
                          <ProfileMemoryCard item={item} city={ctx.city} />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}

              {tab === "about" ? (
                <ProfileDesktopAbout profile={profile} city={ctx.city} mode="owner" />
              ) : null}

              {tab === "activity" ? (
                <ProfileDesktopActivity
                  timeline={ctx.activityTimeline}
                  maxItems={12}
                  showCta
                  onViewAll={() => setTab("activity")}
                />
              ) : null}

              {!["publications", "contributions", "activity", "about"].includes(tab) ? (
                <p className="text-sm text-neutral-500">{PROFILE_DESKTOP_TAB_SOON}</p>
              ) : null}
            </div>

            <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
              <ProfileDesktopRail
                profile={profile}
                levelView={ctx.levelView}
                tribeItems={tribeRailItems}
                contributions={memories.items}
                contributionsLoading={memories.loading}
                city={ctx.city}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
