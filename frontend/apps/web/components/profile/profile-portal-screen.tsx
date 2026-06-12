"use client";

import { ProfileActivitySection } from "@/components/profile/profile-activity-section";
import { ProfileAppShell } from "@/components/profile/profile-app-shell";
import { ProfileBadgesPreview } from "@/components/profile/profile-badges-preview";
import { ProfileHeroBanner } from "@/components/profile/profile-hero-banner";
import { ProfileInternalSidebar } from "@/components/profile/profile-internal-sidebar";
import { ProfileStatsBar } from "@/components/profile/profile-stats-bar";
import { ProfileWidgetsColumn } from "@/components/profile/profile-widgets-column";
import { useProfilePortalContext } from "@/hooks/use-profile-portal-context";
import {
  PROFILE_PORTAL_ERROR,
  PROFILE_PORTAL_LOADING,
  PROFILE_PORTAL_NAV_SETTINGS,
  PROFILE_PORTAL_ONBOARDING_BODY,
  PROFILE_PORTAL_ONBOARDING_CTA,
  PROFILE_PORTAL_ONBOARDING_TITLE,
  PROFILE_PORTAL_RETRY,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback } from "react";

export function ProfilePortalScreen() {
  const ctx = useProfilePortalContext();

  const scrollTo = useCallback((targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (ctx.loading) {
    return (
      <ProfileAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {PROFILE_PORTAL_LOADING}
        </p>
      </ProfileAppShell>
    );
  }

  if (ctx.error || !ctx.profile) {
    return (
      <ProfileAppShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-800">{PROFILE_PORTAL_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_PORTAL_RETRY}
          </button>
        </div>
      </ProfileAppShell>
    );
  }

  return (
    <ProfileAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <ProfileInternalSidebar
            impact={ctx.impactLabel}
            onNavigate={scrollTo}
          />

          <div className="min-w-0 space-y-6">
            <ProfileHeroBanner
              profile={ctx.profile}
              levelTitle={ctx.levelTitle}
              subtitle={ctx.heroSubtitle}
              settingsHref="/profile/me/edit"
            />

            {!ctx.profile.onboarding_completed ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                <h2 className="font-semibold text-amber-900">{PROFILE_PORTAL_ONBOARDING_TITLE}</h2>
                <p className="mt-1 text-sm text-amber-800">{PROFILE_PORTAL_ONBOARDING_BODY}</p>
                <Link
                  href="/profile/me/edit"
                  className="mt-4 inline-flex rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-950"
                >
                  {PROFILE_PORTAL_ONBOARDING_CTA}
                </Link>
              </section>
            ) : null}

            <ProfileStatsBar stats={ctx.stats} />

            <ProfileBadgesPreview
              badges={ctx.badgesPreview.badges}
              emptyCopy={ctx.badgesPreview.emptyCopy}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <ProfileActivitySection
                timeline={ctx.activityTimeline}
                landmarks={ctx.localLandmarks}
                ctas={ctx.journeyCtas}
              />
              <ProfileWidgetsColumn
                city={ctx.city}
                neighborhoodCards={ctx.neighborhoodCards}
                tribeCards={ctx.tribeCards}
                badges={ctx.badges}
              />
            </div>

            <div id="profile-settings" className="rounded-2xl border border-neutral-200/90 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-neutral-600">
                Modifiez votre profil, vos préférences et votre confidentialité depuis vos paramètres.
              </p>
              <Link
                href="/settings"
                className="mt-4 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
              >
                {PROFILE_PORTAL_NAV_SETTINGS}
              </Link>
            </div>

            <p className="text-center text-xs text-neutral-500">
              <Link
                href={`/profile/${ctx.profile.username}`}
                className="font-medium text-yunicity-primary hover:underline"
              >
                Voir le profil public
              </Link>
            </p>
          </div>
        </div>
      </div>
    </ProfileAppShell>
  );
}
