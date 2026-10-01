"use client";

import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import {
  INTEREST_LABELS,
  PROFILE_DESKTOP_ABOUT_BIO_EMPTY,
  PROFILE_DESKTOP_ABOUT_INTERESTS,
  PROFILE_DESKTOP_ABOUT_INTERESTS_EDIT,
  PROFILE_DESKTOP_ABOUT_INTERESTS_HINT,
  PROFILE_DESKTOP_ABOUT_TITLE,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_DESKTOP_LOCAL_CITY,
  formatProfileDesktopMemberSince,
} from "@yunicity/utils";
import Link from "next/link";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

type ProfileDesktopAboutProps = {
  profile: ProfileDesktopProfile;
  city: string;
  mode?: "owner" | "visitor";
};

/** Onglet À propos. */
export function ProfileDesktopAbout({ profile, city, mode = "owner" }: ProfileDesktopAboutProps) {
  const memberSinceLabel = profile.created_at
    ? formatProfileDesktopMemberSince(profile.created_at).replace(/^Membre depuis\s+/i, "")
    : null;

  return (
    <div className="space-y-5" data-profile-desktop-about="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_ABOUT_TITLE}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          {profile.bio?.trim() || PROFILE_DESKTOP_ABOUT_BIO_EMPTY}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">{PROFILE_DESKTOP_LOCAL_CITY}</dt>
            <dd className="mt-0.5 font-semibold text-neutral-900">{city}</dd>
          </div>
          {memberSinceLabel ? (
            <div>
              <dt className="text-neutral-500">Membre depuis</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900">{memberSinceLabel}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_ABOUT_INTERESTS}</h2>
        {profile.interests.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((tag) => {
              const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
              return (
                <span
                  key={tag}
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${TONE_CLASS[tone]}`}
                >
                  {INTEREST_LABELS[tag] ?? tag}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_ABOUT_INTERESTS_HINT}</p>
        )}
        {mode === "owner" ? (
          <>
            <Link
              href="/profile/me/edit"
              className="mt-4 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_DESKTOP_ABOUT_INTERESTS_EDIT}
            </Link>
            <p className="mt-2 text-xs text-neutral-500">{PROFILE_DESKTOP_ABOUT_INTERESTS_HINT}</p>
          </>
        ) : null}
      </section>
    </div>
  );
}
