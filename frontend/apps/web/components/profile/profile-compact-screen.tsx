"use client";

import { ProfileDesktopAbout } from "@/components/profile/desktop/profile-desktop-about";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMediumActivity } from "@/components/profile/medium/profile-medium-activity";
import { ProfileMediumHeroHeader } from "@/components/profile/medium/profile-medium-hero-header";
import { ProfileMobileHeroHeader } from "@/components/profile/mobile/profile-mobile-hero-header";
import { ProfileMediumOverview } from "@/components/profile/medium/profile-medium-overview";
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
  resolveProfileDesktopActiveTribe,
  resolveProfileDesktopNextOuting,
  type ProfileDesktopTabId,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

type ProfilePortalCtx = ReturnType<typeof useProfilePortalContext>;

type ProfileCompactScreenProps = {
  ctx: ProfilePortalCtx;
  /** mobile : colonne étroite ; medium : espacements légèrement plus larges. */
  variant: "mobile" | "medium";
};

/**
 * Portail profil compact — maquette mobile + medium partagée :
 * hero, onglets, aperçu (vie locale → Passport → pubs → activité → nav).
 */
export function ProfileCompactScreen({ ctx, variant }: ProfileCompactScreenProps) {
  const profile = ctx.profile!;
  const [tab, setTab] = useState<ProfileDesktopTabId>("overview");
  const memories = useProfileMemories();

  const displayName = profile.display_name?.trim() || profile.username;
  const avatarUrl = profile.avatar_url?.trim() || null;
  const sectionGap = variant === "mobile" ? "space-y-4" : "space-y-4 sm:space-y-5";

  const activeTribe = useMemo(
    () => resolveProfileDesktopActiveTribe({ city: ctx.city, tribes: ctx.tribes }),
    [ctx.city, ctx.tribes],
  );

  const nextOuting = useMemo(
    () => resolveProfileDesktopNextOuting(ctx.savedEvents),
    [ctx.savedEvents],
  );

  const heroHeader =
    variant === "mobile" ? (
      <ProfileMobileHeroHeader profile={profile} activeTab={tab} onTabChange={setTab} />
    ) : (
      <ProfileMediumHeroHeader profile={profile} activeTab={tab} onTabChange={setTab} />
    );

  const body = (
    <>
      {!profile.onboarding_completed ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 sm:px-5">
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
        <ProfileMediumOverview
          profile={profile}
          levelView={ctx.levelView}
          activeTribe={activeTribe}
          nextOuting={nextOuting}
          city={ctx.city}
          posts={ctx.userPosts}
          displayName={displayName}
          avatarUrl={avatarUrl}
          timeline={ctx.activityTimeline}
          contributions={memories.items}
          contributionsLoading={memories.loading}
          onOpenActivity={() => setTab("activity")}
        />
      ) : (
        <div className={`min-w-0 ${sectionGap}`}>
          {tab === "publications" ? (
            <ProfileDesktopPublications
              posts={ctx.userPosts}
              displayName={displayName}
              avatarUrl={avatarUrl}
              maxItems={12}
            />
          ) : null}

          {tab === "contributions" ? (
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-neutral-900">Mes contributions</h2>
              {memories.loading ? (
                <p className="mt-4 text-sm text-neutral-500" role="status">
                  {PROFILE_MEMORIES_LOADING}
                </p>
              ) : memories.items.length === 0 ? (
                <div className="mt-4">
                  <p className="font-semibold text-neutral-800">{PROFILE_MEMORIES_EMPTY_TITLE}</p>
                  <p className="mt-1 text-sm text-neutral-500">{PROFILE_MEMORIES_EMPTY_BODY}</p>
                  <Link
                    href={PROFILE_MEMORIES_EMPTY_HREF}
                    className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {PROFILE_MEMORIES_EMPTY_CTA}
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {memories.items.map((item) => (
                    <li key={item.id}>
                      <ProfileMemoryCard item={item} city={ctx.city} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === "activity" ? (
            <ProfileMediumActivity timeline={ctx.activityTimeline} maxItems={20} />
          ) : null}

          {tab === "about" ? (
            <ProfileDesktopAbout profile={profile} city={ctx.city} />
          ) : null}

          {!["publications", "contributions", "activity", "about"].includes(tab) ? (
            <p className="text-sm text-neutral-500">{PROFILE_DESKTOP_TAB_SOON}</p>
          ) : null}
        </div>
      )}
    </>
  );

  if (variant === "mobile") {
    return (
      <div data-profile-compact="" data-profile-compact-variant="mobile">
        <div className="profile-mobile-hero-bleed">{heroHeader}</div>
        <div className={`profile-mobile-content-shell px-3 pb-2 pt-4 ${sectionGap}`}>{body}</div>
      </div>
    );
  }

  return (
    <div className={sectionGap} data-profile-compact="" data-profile-compact-variant="medium">
      {heroHeader}
      {body}
    </div>
  );
}
