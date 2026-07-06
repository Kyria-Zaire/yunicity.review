"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { ProfileMe } from "@yunicity/types";
import {
  PROFILE_MOBILE_EDIT_CTA,
  PROFILE_MOBILE_STAT_EVENTS,
  PROFILE_MOBILE_STAT_PUBLICATIONS,
  PROFILE_MOBILE_STAT_TRIBES,
  formatProfileMobileStatCount,
} from "@yunicity/utils";
import { Camera, MapPin } from "lucide-react";
import Link from "next/link";

type ProfileMobileSummaryCardProps = {
  profile: ProfileMe;
  displayName: string;
  levelTitle: string;
  publicationsCount: number;
  tribesCount: number;
  eventsCount: number;
};

/** Carte identité profil mobile (MOBILE-PROFILE-01). */
export function ProfileMobileSummaryCard({
  profile,
  displayName,
  levelTitle,
  publicationsCount,
  tribesCount,
  eventsCount,
}: ProfileMobileSummaryCardProps) {
  const avatarUrl = profile.avatar_url?.trim() || null;

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-[#eef4ff] via-[#f5f8ff] to-[#e8f0ff] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Link href="/profile/me/edit" className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <ProfileAvatar name={displayName} size="lg" />
            )}
            <span className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-white shadow">
              <Camera className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Link>

          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-neutral-900">{displayName}</h2>
              {profile.onboarding_completed ? (
                <span className="inline-flex shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  {levelTitle}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">@{profile.username}</p>
            {profile.city?.trim() ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-neutral-600">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                {profile.city.trim()}, France
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href="/profile/me/edit"
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          {PROFILE_MOBILE_EDIT_CTA}
        </Link>
      </div>

      {profile.bio?.trim() ? (
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">{profile.bio.trim()}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 divide-x divide-neutral-200/80 rounded-2xl border border-white/70 bg-white/70 py-3 text-center backdrop-blur-sm">
        <div className="px-2">
          <p className="text-lg font-bold text-neutral-900">
            {formatProfileMobileStatCount(publicationsCount)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
            {PROFILE_MOBILE_STAT_PUBLICATIONS}
          </p>
        </div>
        <div className="px-2">
          <p className="text-lg font-bold text-neutral-900">
            {formatProfileMobileStatCount(tribesCount)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
            {PROFILE_MOBILE_STAT_TRIBES}
          </p>
        </div>
        <div className="px-2">
          <p className="text-lg font-bold text-neutral-900">
            {formatProfileMobileStatCount(eventsCount)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
            {PROFILE_MOBILE_STAT_EVENTS}
          </p>
        </div>
      </div>
    </section>
  );
}
