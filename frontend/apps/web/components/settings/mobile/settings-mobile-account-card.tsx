"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { ProfileMe } from "@yunicity/types";
import {
  SETTINGS_MOBILE_BADGE_YUNICIZEN,
  SETTINGS_MOBILE_VIEW_PROFILE,
  settingsDesktopUsername,
} from "@yunicity/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type SettingsMobileAccountCardProps = {
  profile: ProfileMe;
  displayName: string;
};

/** Carte profil résumé mobile (MOBILE-SETTINGS-02). */
export function SettingsMobileAccountCard({
  profile,
  displayName,
}: SettingsMobileAccountCardProps) {
  const username = settingsDesktopUsername(profile);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={displayName} src={profile.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-neutral-900">{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm text-neutral-500">{username}</span>
            <span className="inline-flex rounded-full bg-yunicity-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {SETTINGS_MOBILE_BADGE_YUNICIZEN}
            </span>
          </div>
        </div>
        <Link
          href="/profile/me"
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-yunicity-primary/35 px-2.5 py-2 text-xs font-semibold text-yunicity-primary"
        >
          {SETTINGS_MOBILE_VIEW_PROFILE}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
