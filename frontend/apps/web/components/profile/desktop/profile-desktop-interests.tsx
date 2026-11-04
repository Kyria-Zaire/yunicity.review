"use client";

import type { ProfileMe } from "@yunicity/types";
import {
  INTEREST_LABELS,
  PROFILE_DESKTOP_ABOUT_INTERESTS,
  PROFILE_DESKTOP_ABOUT_INTERESTS_EDIT,
  PROFILE_DESKTOP_ABOUT_INTERESTS_HINT,
  PROFILE_DESKTOP_INTEREST_TONE,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  Dumbbell,
  Gamepad2,
  Laptop,
  Music,
  Palette,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

const INTEREST_ICON: Record<string, LucideIcon> = {
  culture: Building2,
  art: Palette,
  music: Music,
  tech: Laptop,
  gaming: Gamepad2,
  entrepreneurship: Briefcase,
  business: Briefcase,
  food: Utensils,
  nightlife: Users,
  sports: Dumbbell,
  fitness: Dumbbell,
};

type ProfileDesktopInterestsProps = {
  profile: ProfileMe;
};

/** Centres d’intérêt — colonne centrale aperçu (maquette 2). */
export function ProfileDesktopInterests({ profile }: ProfileDesktopInterestsProps) {
  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-profile-desktop-interests=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_ABOUT_INTERESTS}</h2>
      {profile.interests.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.map((tag) => {
            const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
            const Icon = INTEREST_ICON[tag] ?? Users;
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {INTEREST_LABELS[tag] ?? tag}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_ABOUT_INTERESTS_HINT}</p>
      )}
      <Link
        href="/profile/me/edit"
        className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {PROFILE_DESKTOP_ABOUT_INTERESTS_EDIT} →
      </Link>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        {PROFILE_DESKTOP_ABOUT_INTERESTS_HINT}
      </p>
    </section>
  );
}
