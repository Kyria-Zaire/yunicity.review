"use client";

import { ProfileMobileContentTabs } from "@/components/profile/mobile/profile-mobile-content-tabs";
import { ProfileMobileHeader } from "@/components/profile/mobile/profile-mobile-header";
import { ProfileMobilePostsFeed } from "@/components/profile/mobile/profile-mobile-posts-feed";
import { ProfileMobileShortcuts } from "@/components/profile/mobile/profile-mobile-shortcuts";
import { ProfileMobileSummaryCard } from "@/components/profile/mobile/profile-mobile-summary-card";
import type { AuthUser, FeedPost, ProfileMe } from "@yunicity/types";
import type { PassportLevelView, ProfileMobileContentTabId, ProfilePortalStat } from "@yunicity/utils";
import {
  PROFILE_MOBILE_PUBLIC_LINK,
  PROFILE_PORTAL_ONBOARDING_BODY,
  PROFILE_PORTAL_ONBOARDING_CTA,
  PROFILE_PORTAL_ONBOARDING_TITLE,
  buildProfileMobileShortcuts,
  buildSettingsDisplayName,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

type ProfileMobileViewProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  levelTitle: string;
  levelView: PassportLevelView | null;
  stats: ProfilePortalStat[];
  userPosts: FeedPost[];
  savedEventsCount: number;
  interestedEventsCount: number;
};

function readStatValue(stats: ProfilePortalStat[], id: ProfilePortalStat["id"]): number {
  return stats.find((stat) => stat.id === id)?.value ?? 0;
}

/** Vue mobile Profil — layout capture MOBILE-PROFILE-01. */
export function ProfileMobileView({
  user,
  profile,
  levelTitle,
  levelView,
  stats,
  userPosts,
  savedEventsCount,
  interestedEventsCount,
}: ProfileMobileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileMobileContentTabId>("publications");
  const displayName = buildSettingsDisplayName(profile, user);

  const shortcuts = useMemo(
    () =>
      buildProfileMobileShortcuts({
        savedEventsCount,
        interestedEventsCount,
      }),
    [interestedEventsCount, savedEventsCount],
  );

  return (
    <div className="web-mobile-profile-portal-only min-w-0 bg-[#F4F5F7] pb-24">
      <ProfileMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        {!profile.onboarding_completed ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <h2 className="font-semibold text-amber-900">{PROFILE_PORTAL_ONBOARDING_TITLE}</h2>
            <p className="mt-1 text-sm text-amber-800">{PROFILE_PORTAL_ONBOARDING_BODY}</p>
            <Link
              href="/profile/me/edit"
              className="mt-3 inline-flex rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-950"
            >
              {PROFILE_PORTAL_ONBOARDING_CTA}
            </Link>
          </section>
        ) : null}

        <ProfileMobileSummaryCard
          profile={profile}
          displayName={displayName}
          levelTitle={levelTitle}
          publicationsCount={userPosts.length}
          tribesCount={readStatValue(stats, "tribes")}
          eventsCount={readStatValue(stats, "meetings")}
        />

        <ProfileMobileShortcuts shortcuts={shortcuts} />

        <ProfileMobileContentTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        <ProfileMobilePostsFeed
          profile={profile}
          posts={userPosts}
          levelView={levelView}
          activeTab={activeTab}
        />

        <p className="pb-2 text-center text-xs text-neutral-500">
          <Link
            href={`/profile/${profile.username}`}
            className="font-medium text-yunicity-primary hover:underline"
          >
            {PROFILE_MOBILE_PUBLIC_LINK}
          </Link>
        </p>
      </div>
    </div>
  );
}
